import { TimeoutError, type Page } from "puppeteer";
import type { Context, FnArgs, IAgentDriver } from "../agent-driver";
import type { IDriverAction } from "./base-action";
import { PageNavigator, type IPageNavigator } from "../document";
import { ElementAction } from "./element-action";

export interface IClickLinkAction extends IDriverAction {}

export class ClickLinkAction extends ElementAction implements IClickLinkAction {
	message = "";
	link?: HTMLAnchorElement;
	linkId?: string;
	linkText?: string;
	userMsg?: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	linksAndInputs: any;
	url?: string;

	requestCount = 0;
	responseCount = 0;
	downloadStarted = false;
	navigator: IPageNavigator;

	constructor(
		driver: IAgentDriver,
		fnArgs: FnArgs,
		context: Context,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		linksAndInputs: any[],
	) {
		super(driver, fnArgs, context);
		this.linkId = fnArgs.pgpt_id;
		this.linkText = fnArgs.text;
		this.linksAndInputs = linksAndInputs;
		this.navigator = this.createNavigator();
	}

	protected createNavigator() {
		return new PageNavigator(this.driver);
	}

	protected missingLinkId() {
		if (this.linkId) {
			return;
		}
		this.message = "ERROR: Missing parameter pgpt_id";
	}

	missingLinkText() {
		if (this.linkText) {
			return;
		}
		this.message = "";
		this.context.pop();
		this.userMsg =
			"Please the correct link on the page. Remember to set both the text and the pgpt_id parameter.";
	}

	findLink() {
		return this.linksAndInputs.find(
			(elem: Element) => elem && elem.id === this.linkId,
		);
	}

	get page() {
		return this.driver.page;
	}

	onStart(linkText?: string) {
		this.log(`${this.taskPrefix}Clicking link "${linkText}"`);
	}

	initAction() {
		this.onStart(this.link?.text);
		this.requestCount = 0;
		this.responseCount = 0;
		this.downloadStarted = false;

		if (!this.page?.$(this.linkElementSelector)) {
			throw new Error("Element not found");
		}
	}

	get linkElementSelector() {
		return `.pgpt-element${this.linkId}`;
	}

	action() {
		this.link = this.findLink();
		try {
			this.clickLink();
		} catch (error) {
			this.log(error);
			if (error instanceof TimeoutError) {
				return this.onTimeOutError(this.link);
			}
			this.onError(this.link);
		}
	}

	onTimeOutError(_link?: HTMLAnchorElement) {
		this.sendMessage("NOTICE: The click did not cause a navigation.");
	}

	onError(link: any) {
		const linkText = link ? link.text : "";
		const message = `Sorry, but link number ${this.linkId} (${linkText}) is not clickable, please select another link or another command. You can also try to go to the link URL directly with "goto_url".`;
		this.sendMessage(message);
	}

	async clickLink() {
		this.validatePage();
		this.clickOnPage();
		await this.waitForNavigation();
		this.url = await this.page?.url();

		this.onDownloadStarted() || this.onLinkNavigation();
	}

	clickOnPage() {
		this.page?.click(this.linkElementSelector);
	}

	async waitForNavigation() {
		await this.navigator.waitForNavigation;
	}

	onLinkNavigation() {
		const message = `Link clicked! You are now on ${this.url}`;
		this.sendMessage(message);
	}

	onDownloadStarted() {
		if (!this.downloadStarted) {
			return;
		}
		// ??
		// downloadStarted = false;
		// noContent = true;
		const message = "Link clicked and file download started successfully!";
		this.sendMessage(message);
		return true;
	}

	async execute() {
		this.missingLinkId();
		this.missingLinkText();
		return await this.scrapePage();
	}

	validatePage() {
		if (!this.page) {
			throw new Error("Missing page to scrape");
		}
	}

	async scrapePage() {
		this.validatePage();
		this.log(`${this.taskPrefix}Scraping page...`);
		this.linksAndInputs = this.page && (await this.getElementsOn(this.page));
	}

	getElementsOn(page: Page) {
		return this.elementSelector?.getElements(page);
	}
}
