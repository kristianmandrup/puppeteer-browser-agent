import { TimeoutError, type Page } from "puppeteer";
import type { IAgentDriver } from "../agent-driver";
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

	name = "click_link";

	constructor(
		driver: IAgentDriver,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		linksAndInputs: any[],
	) {
		super(driver);
		this.linksAndInputs = linksAndInputs;
		this.navigator = this.createNavigator();
	}

	protected updateState() {
		this.linkId = this.fnArgs.pp_id;
		this.linkText = this.fnArgs.text;
	}

	protected createNavigator() {
		return new PageNavigator(this.driver);
	}

	protected missingLinkId() {
		if (this.linkId) {
			return;
		}
		this.message = "ERROR: Missing parameter pp_id";
	}

	protected missingLinkText() {
		if (this.linkText) {
			return;
		}
		this.message = "";
		this.context.pop();
		this.userMsg =
			"Please the correct link on the page. Remember to set both the text and the pp_id parameter.";
	}

	protected findLink() {
		return this.linksAndInputs.find(
			(elem: Element) => elem && elem.id === this.linkId,
		);
	}

	protected get page() {
		return this.driver.page;
	}

	protected onStart(linkText?: string) {
		this.logTask(`Clicking link "${linkText}"`);
	}

	protected initAction() {
		this.onStart(this.link?.text);
		this.requestCount = 0;
		this.responseCount = 0;
		this.downloadStarted = false;

		if (!this.page?.$(this.linkElementSelector)) {
			throw new Error("Element not found");
		}
	}

	protected get linkElementSelector() {
		if (!this.linkId) {
			throw new Error("Missing linkId");
		}
		return this.driver.markerClass(this.linkId);
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
		this.setMessage("NOTICE: The click did not cause a navigation.");
	}

	onError(link: any) {
		const linkText = link ? link.text : "";
		const message = `Sorry, but link number ${this.linkId} (${linkText}) is not clickable, please select another link or another command. You can also try to go to the link URL directly with "goto_url".`;
		this.setMessage(message);
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
		this.setMessage(message);
	}

	onDownloadStarted() {
		if (!this.downloadStarted) {
			return;
		}
		this.downloadStarted = false;
		this.noContent = true;
		const message = "Link clicked and file download started successfully!";
		this.setMessage(message);
		return true;
	}

	set noContent(val: boolean) {
		this.driver.setNoContent(val);
	}

	get noContent() {
		return this.driver.noContent;
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
		this.logTask("Scraping page...");
		this.linksAndInputs = this.page && (await this.getElementsOn(this.page));
	}

	getElementsOn(page: Page) {
		return this.elementSelector?.getElements(page);
	}
}
