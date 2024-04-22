import type { ElementHandle } from "puppeteer";
import { BaseDriverAction, type IDriverAction } from "./base-action";

export abstract class ElementAction
	extends BaseDriverAction
	implements IDriverAction
{
	protected async getTabbableElements() {
		if (!this.page) {
			throw new Error("Missing page");
		}
		return await this.elementSelector?.getElements(this.page);
	}

	async getContentForFirst(handle: ElementHandle, selector: string) {
		return await handle.$eval(selector, (elem: Element) => elem.textContent);
	}

	async getContentForAll(mainHandle: ElementHandle, selector: string) {
		const handles = await mainHandle.$$(selector);
		const results: string[] = [];
		for (const handle of handles) {
			const elem: Element = await this.handleToElement(handle);
			if (elem.textContent) {
				results.push(elem.textContent);
			}
		}
		return results;
	}

	async handleToElement(element: ElementHandle<Element>): Promise<Element> {
		return await element.evaluate((el: Element) => {
			return el;
		});
	}

	protected matchesContent(element: Element, content: string) {
		return (
			content &&
			!element.textContent
				?.toLocaleLowerCase()
				?.includes(content.toLocaleLowerCase())
		);
	}

	protected markerClass(id: number | string) {
		return this.driver.markerClass(id);
	}

	protected get elementSelector() {
		return this.driver.elementSelector;
	}

	protected set element(elem: ElementHandle<Element>) {
		this.driver.element = elem;
	}

	protected get element(): ElementHandle<Element> | undefined {
		return this.driver.element;
	}
}
