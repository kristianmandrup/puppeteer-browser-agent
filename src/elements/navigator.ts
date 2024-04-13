import type { Page } from "puppeteer";
import { ElementEvaluator } from "./evaluator.js";

export class PageNavigator {
	page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	// string, ...args: Params
	// biome-ignore lint/suspicious/useAwait: <explanation>
	onEvaluate = async (element: Element, id: number, selector: string) => {
		const evaluator = new ElementEvaluator(element, id, selector);
		return evaluator.evaluate();
	};

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	async nextInteractiveElement(element: any, id: number, selector = "*") {
		const page = this.page;
		const onEvaluate = this.onEvaluate.bind(this);
		const obj = await page.evaluate(onEvaluate, element, id, selector);

		if (!obj) {
			return false;
		}

		const visible = await page.evaluate((id) => {
			const element = document.querySelector(`.pgpt-element${id}`);

			if (!element) {
				return false;
			}
			const style = getComputedStyle(element);
			const visibility = style.visibility;
			const display = style.display;
			const clip = style.clip;
			const rect = element.getBoundingClientRect();

			return (
				visibility !== "hidden" &&
				display !== "none" &&
				rect.width !== 0 &&
				rect.height !== 0 &&
				clip !== "rect(1px, 1px, 1px, 1px)" &&
				clip !== "rect(0px, 0px, 0px, 0px)"
			);
		}, id);

		if (!visible) {
			return false;
		}
		await page.evaluate((id) => {
			const element = document.querySelector(`.pgpt-element${id}`);
			if (!element) {
				return;
			}
			this.addBoundingBoxTo(element, id);
		}, id);

		return obj;
	}

	addBoundingBoxTo(element: Element, id: number) {
		element.setAttribute("pgpt-id", String(id));
		const style = getComputedStyle(element);
		style.border = "1px solid red";
	}
}