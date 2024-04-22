import type { ElementHandle } from "puppeteer";
import { ElementAction } from "./element-action";

// returns the page outline from the title and top header-like elements
export class SectionOutlineAction extends ElementAction {
	taskName = "section_outline";

	get maxSectionTextSize() {
		return this.fnArgs.maxTextSize || 200;
	}

	get headersSelector() {
		return "h1,h2,h3,h4,h5,h6,.title,.header";
	}

	async execute() {
		const title = await this.page?.title();
		const headers = await this.page?.$$(this.headersSelector);
		if (!headers) {
			return;
		}
		const results: any[] = [{ title }];
		for (const header of headers) {
			const headerTitle = await this.getContentFor(header);
			const text = await this.textContentFor(header);
			const result = {
				header: headerTitle,
				text,
			};
			results.push(result);
		}
		const message = JSON.stringify(results);
		this.addToMessage(message);
	}

	async textContentFor(handle: ElementHandle) {
		const paragraphs = await handle.$$eval("p", (elements) =>
			elements.map((elem) => `${elem.textContent}`),
		);
		const text = paragraphs.join("\n");
		return this.sliceOff(text, this.maxSectionTextSize);
	}
}
