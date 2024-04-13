import type { Page, TimeoutError } from "puppeteer";
import type { AgentDriver, Context, FnArgs } from "..";
import { BaseDriverAction } from "./base-action";

export class ClickLinkAction extends BaseDriverAction {
	message = ""
	linkId?: string
	linkText?: string
	userMsg?: string
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	linksAndInputs: any[]

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	constructor(driver: AgentDriver, fnArgs: FnArgs, context: Context, linksAndInputs: any[]) {
		super(driver, fnArgs, context)
		this.linkId = fnArgs.pgpt_id;
		this.linkText = fnArgs.text;
		this.linksAndInputs = linksAndInputs
	}

	get elementSelector() {
		return this.driver.elementSelector
	}
		
	missingLinkId() {
		if (this.linkId) {
			return
		}
		this.message = "ERROR: Missing parameter pgpt_id";
	}

	missingLinkText() {
		if (this.linkText) {
			return
		}
		this.message = "";
		this.context.pop();
		this.userMsg = "Please the correct link on the page. Remember to set both the text and the pgpt_id parameter."		
	}

	findLink() {
		return this.linksAndInputs.find(
			(elem) => elem && elem.id === this.linkId,
		);
	
	}

	get page() {
		return this.driver.page
	}

	onStart(linkText: string) {
		print(`${this.taskPrefix}Clicking link "${linkText}"`);
	}

	initAction() {
		this.onStart(this.link.text);
		requestCount = 0;
		responseCount = 0;
		downloadStarted = false;

		if (!this.page.$(this.linkElementSelector)) {
			throw new Error("Element not found");
		}
	}

	get linkElementSelector() {
		return `.pgpt-element${this.linkId}`
	}

	action() {
		const link = this.findLink()
		try {
			this.clickLink()
		} catch (error) {
			this.log(error)
			if (error instanceof TimeoutError) {
				return this.onTimeOutError(link)
			} 
			this.onError(link)
		}
	}

	onTimeOutError(_link: any) {
		this.sendMessage("NOTICE: The click did not cause a navigation.")		
	}

	onError(link: any) {
		const linkText = link ? link.text : "";
		const message = `Sorry, but link number ${this.linkId} (${linkText}) is not clickable, please select another link or another command. You can also try to go to the link URL directly with "goto_url".`;
		this.sendMessage(message)
	}


	async clickLink() {
		this.page.click(this.linkElementSelector);

		await this.waitForNavigation(page);

		let url = await page.url();

		this.onDownloadStarted() || this.onLinkNavigation()
		
	}

	onLinkNavigation() {
		const message = `Link clicked! You are now on ${url}`;
		this.sendMessage(message)	
	}

	get downloadStarted() {
		return false
		// return this.driver.downloadStarted
	}

	onDownloadStarted() {
		if (!this.downloadStarted) {
			return
		}
		// ??
		// downloadStarted = false;
		// noContent = true;
		const message = "Link clicked and file download started successfully!";		
		this.sendMessage(message)
		return true
	}

	execute() {
		this.missingLinkId()
		this.missingLinkText()
		this.scrapePage()
	}	

	scrapePage() {
		print(taskPrefix + "Scraping page...");
		this.linksAndInputs = await getElementsOn(page);
	}

	getElementsOn(page: Page) {
		this.elementSelector.getElements(page)
	}
}
