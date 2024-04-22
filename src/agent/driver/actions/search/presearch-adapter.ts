import type { ElementHandle, Page } from "puppeteer";

export interface ISearchResult {
	href: string;
	title: string;
	description?: string;
}

export interface ISearchEngineAdapter {
	getSearchResults(): Promise<ISearchResult[]>;
}

export class PresearchAdapter implements ISearchEngineAdapter {
	page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get resultSelector() {
		return "div.relative";
	}

	get resultLink() {
		// get href
		return "a.text-results-link";
	}

	get resultTitle() {
		return "span[x-html*='result.title']";
	}

	get resultDescription() {
		return "span[x-html*='result.description'], .result\\.description";
	}

	async getContentFor(handle: ElementHandle, selector: string) {
		return await handle.$eval(selector, (elem: Element) => {
			return elem.textContent;
		});
	}

	async getSearchResultFrom(handle: ElementHandle) {
		const href = await handle.$eval(this.resultLink, (elem: Element) => {
			return elem.getAttribute("href");
		});
		const title = await this.getContentFor(handle, this.resultTitle);
		if (!(href && title)) {
			return;
		}
		const description = await this.getContentFor(
			handle,
			this.resultDescription,
		);
		return {
			href: href,
			title: title,
			description: description ? description : undefined,
		};
	}

	async getSearchResults() {
		const handles: ElementHandle[] = await this.page.$$(this.resultSelector); // get href
		const results: ISearchResult[] = [];
		for (const handle of handles) {
			const result = await this.getSearchResultFrom(handle);
			if (result) {
				results.push(result);
			}
		}
		return results;
	}
}
