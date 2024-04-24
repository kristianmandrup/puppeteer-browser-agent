import type { ElementHandle } from "puppeteer";
import { ElementAction } from "./element-action";
import { sectionOutline } from "./definitions/section-outline";

// returns the page outline from the title and top header-like elements
export class SectionOutlineAction extends ElementAction {
	taskName = "section_outline";
	definition = sectionOutline;

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
			const headerElem = await this.handleToElement(header)
			const text = await this.getRelevantTextBeforeNextHeader(headerElem);
			const result = {
				header: headerTitle,
				text,
			};
			results.push(result);
		}
		const message = JSON.stringify(results);
		this.addToMessage(message);
	}
}
