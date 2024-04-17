import type { Page } from "puppeteer";
import { HtmlFormatter, type IHtmlFormatter } from "./html-formatter";
import type { DebugOpts } from "../../../types";
import type { IAgentDriver } from "../driver";

export interface IPageScraper {
	getPageContent(page: Page): Promise<string>;
}

export class PageScraper implements IPageScraper {
	htmlFormatter: IHtmlFormatter;
	debug: boolean;
	driver: IAgentDriver;

	constructor(driver: IAgentDriver, opts: DebugOpts = {}) {
		this.driver = driver;
		this.debug = Boolean(opts.debug);
		this.htmlFormatter = this.createHtmlFormatter();
	}

	createHtmlFormatter() {
		return new HtmlFormatter(this.driver);
	}

	async getPageContent(page: Page) {
		const title = await page.evaluate(() => {
			return document.title;
		});

		const html = await page.evaluate(() => {
			return document.body.innerHTML;
		});

		const formattedHtml = this.formatHtml(html);

		return `## START OF PAGE CONTENT ##\nTitle: ${title}\n\n${formattedHtml}\n## END OF PAGE CONTENT ##`;
	}

	// TODO: // use formatter
	formatHtml(html: string) {
		return this.htmlFormatter.format(html);
	}
}
