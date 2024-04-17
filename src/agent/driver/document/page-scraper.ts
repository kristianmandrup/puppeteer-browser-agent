import type { Page } from "puppeteer";
import { HtmlFormatter, type IHtmlFormatter } from "./html-formatter";
import type { DebugOpts } from "../../../types";
import type { IAgentDriver } from "../agent-driver";
import {
	DocumentTraverser,
	type IDocumentTraverser,
} from "./document-traverser";

export interface IPageScraper {
	getPageContent(page: Page): Promise<string>;
}

export class PageScraper implements IPageScraper {
	debug: boolean;
	opts: DebugOpts;
	driver: IAgentDriver;
	documentTraverser: IDocumentTraverser;

	constructor(driver: IAgentDriver, opts: DebugOpts = {}) {
		this.driver = driver;
		this.opts = opts;
		this.debug = Boolean(opts.debug);
		this.documentTraverser = this.createDocumentTraverser();
	}

	createDocumentTraverser() {
		return new DocumentTraverser(this.driver, this.opts);
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

	formatHtml(html: string) {
		return this.documentTraverser.start(html);
	}
}
