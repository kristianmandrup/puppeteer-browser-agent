import type { ElementHandle, Page } from "puppeteer";
import fs from "node:fs";
import { InteractiveElementHandler } from "./interactive-element-handler.js";
import type { IAgentDriver } from "../agent/index.js";

type SelectorOpts = {
	debug?: boolean;
};

export interface IElementSelector {
	getElements(page: Page, selector?: string): Promise<ElementHandle<Element>[]>;
}

export class ElementSelector implements IElementSelector {
	page?: Page;
	interactiveElementHandler: InteractiveElementHandler;
	skipped: ElementHandle<Element>[] = [];
	selected: ElementHandle<Element>[] = [];
	debug: boolean;
	driver: IAgentDriver;

	constructor(driver: IAgentDriver, opts: SelectorOpts = {}) {
		this.driver = driver;
		this.debug = Boolean(opts.debug);
		this.interactiveElementHandler = this.createInteractiveElementHandler();
	}

	public async getElements(page: Page, selector = "*") {
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

	protected createInteractiveElementHandler() {
		return new InteractiveElementHandler(this.driver);
	}

	protected get elementSelector() {
		return 'input:not([type=hidden]):not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), select:not([disabled]), a[href]:not([href="javascript:void(0)"]):not([href="#"])';
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	protected async getNext(element: any, id: number, selector: string) {
		return await this.interactiveElementHandler.nextInteractiveElement(
			element,
			id,
			selector,
		);
	}

	protected skipElement(element: ElementHandle<Element>) {
		this.skipped.push(element);
	}

	protected selectElement(element: ElementHandle<Element>) {
		this.selected.push(element);
	}

	protected writeElements(
		fileName: string,
		elements: ElementHandle<Element>[],
	) {
		if (!this.debug) {
			return;
		}
		fs.writeFileSync(fileName, JSON.stringify(elements, null, 2));
	}

	protected logElements() {
		this.writeElements("skipped.json", this.skipped);
		this.writeElements("selected.json", this.selected);
	}
}
