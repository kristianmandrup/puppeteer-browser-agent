import type { ElementHandle } from "puppeteer";
import { BaseDriverAction, type IDriverAction } from "./base-action";
import { getCssSelector } from "css-selector-generator";

export abstract class ElementAction
	extends BaseDriverAction
	implements IDriverAction
{
	protected getCssSelector(elem: Element): string {
		return getCssSelector(elem);
	}

	protected getRelevantTextBeforeNextHeader(headingElement: Element) {
		const excludeSelector = 'header, footer, nav, aside, div.sidebar, code, table, figure, dialog, modal';
		const excludedElements = headingElement.parentElement?.querySelectorAll(excludeSelector);
		let excludedSet = new Set<Element>([]) 
		if (excludedElements) {
			excludedSet = new Set(Array.from(excludedElements));
		}		
		
		let textBeforeNextHeader = '';
		let currentNode = headingElement.nextElementSibling;
	
		while (currentNode) {
			if (currentNode.tagName && currentNode.tagName.match(/^H[1-6]$/)) {
				break;
			}
			if (!excludedSet.has(currentNode)) {
				textBeforeNextHeader += currentNode.textContent;
			}
			currentNode = currentNode.nextElementSibling;
		}
	
		return textBeforeNextHeader;
	}

	protected findNearestHeadingElement(startElement: Element) {
		let nearestHeading = null;
		let currentNode = startElement.previousElementSibling;

		while (currentNode) {
			if (currentNode.tagName && currentNode.tagName.match(/^H[1-6]$/)) {
				nearestHeading = currentNode;
				break;
			}
			currentNode = currentNode.previousElementSibling;
		}

		if (!nearestHeading) {
			currentNode = startElement.parentElement;
			while (currentNode) {
				if (currentNode.tagName && currentNode.tagName.match(/^H[1-6]$/)) {
					nearestHeading = currentNode;
					break;
				}
				currentNode = currentNode.parentElement;
			}
		}

		return nearestHeading ? nearestHeading : undefined;
	}

	protected async getTabbableElements() {
		if (!this.page) {
			throw new Error("Missing page");
		}
		return await this.elementSelector?.getElements(this.page);
	}

	async getContentFor(handle: ElementHandle, maxLength = 60) {
		return await handle.evaluate((el: Element) => {
			return `${el.textContent}`.slice(0, maxLength);
		});
	}

	protected sliceOff(text?: string, length?: number) {
		const maxLength = length || 32;
		return text && text.length > maxLength
			? `${text.substring(0, maxLength)}[..]`
			: text;
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
