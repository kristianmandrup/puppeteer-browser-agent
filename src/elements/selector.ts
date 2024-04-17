import type { ElementHandle, Page } from "puppeteer";
import fs from "node:fs";
import { PageNavigator } from "./navigator.js";

type SelectorOpts = {
	debug?: boolean;
};

export interface IElementSelector {
	getElements(page: Page, selector?: string): Promise<ElementHandle<Element>[]>;
}

export class ElementSelector implements IElementSelector {
	page: Page;
	navigator: PageNavigator;
	skipped: ElementHandle<Element>[] = [];
	selected: ElementHandle<Element>[] = [];
	debug?: boolean;

	constructor(page: Page, opts: SelectorOpts = {}) {
		this.page = page;
		this.navigator = this.createPageNavigator();
		this.debug = opts.debug;
	}

	createPageNavigator() {
		return new PageNavigator(this.page);
	}

	get elementSelector() {
		return 'input:not([type=hidden]):not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), select:not([disabled]), a[href]:not([href="javascript:void(0)"]):not([href="#"])';
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	async getNext(element: any, id: number, selector: string) {
		return await this.navigator.nextInteractiveElement(element, id, selector);
	}

	async getElements(page: Page, selector = "*") {
		let id = 0;

		const elements: ElementHandle<Element>[] = await page
			.mainFrame()
			.$$(this.elementSelector);

		let limit = 400;

		for (const element of elements) {
			if (--limit < 0) {
				this.skipElement(element);
				break;
			}

			const nextElem = await this.getNext(element, ++id, selector);
			if (nextElem) {
				this.selectElement(element);
			}
		}

		this.logElements();

		return elements;
	}

	skipElement(element: ElementHandle<Element>) {
		this.skipped.push(element);
	}

	selectElement(element: ElementHandle<Element>) {
		this.selected.push(element);
	}

	writeElements(fileName: string, elements: ElementHandle<Element>[]) {
		if (!this.debug) {
			return;
		}
		fs.writeFileSync(fileName, JSON.stringify(elements, null, 2));
	}

	logElements() {
		this.writeElements("skipped.json", this.skipped);
		this.writeElements("selected.json", this.selected);
	}
}
