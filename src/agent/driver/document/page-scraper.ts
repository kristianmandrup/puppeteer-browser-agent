import type { Page } from "puppeteer";

export class PageScraper {
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
	formatHtml(html) {
		return html;
	}
}
