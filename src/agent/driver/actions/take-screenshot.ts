import type { IDriverAction } from "./base-action";
import { takeScreenshot } from "./definitions/take-screenshot";
import { ElementAction } from "./element-action";

export type ITakeScrenshotAction = IDriverAction;

export type FindElementDetails = {
	parentType?:
		| "main"
		| "footer"
		| "header"
		| "aside"
		| "dialog"
		| "nav"
		| "article"
		| "section"
		| "form";
	parentId?: string;
	type:
		| "header"
		| "section"
		| "field"
		| "form"
		| "canvas"
		| "figure"
		| "article"
		| "video"
		| "code"
		| "table"

	id?: string;
	selector?: string;
	content?: string;
};

// Takes a screenshot of the page
export class TakeScrenshotAction
	extends ElementAction
	implements ITakeScrenshotAction
{
	name = "take_screenshot";
	definition = takeScreenshot;

	get filePath() {
		return this.fnArgs.filepath;
	}

	get startFrom() {
		return this.fnArgs.startFrom;
	}

	get screenshotOptions() {
		return {
			path: this.filePath,
		};
	}

	public async execute() {
		(await this.pageScreenshot()) || (await this.elementScreenshot());
	}

	async pageScreenshot() {
		if (this.startFrom) {
			return;
		}
		await this.page?.screenshot(this.screenshotOptions);
		return true;
	}

	parentSelector(startFrom: FindElementDetails) {
		switch (startFrom.parentType) {
			case "header":
				return "h1,h2,h3";
			default:
				return startFrom.parentType;
		}
	}

	mainSelector(startFrom: FindElementDetails) {
		switch (startFrom.type) {
			case "header":
				return "h1,h2,h3";
			case "field":
				return "input,select,textarea";
			default:
				return startFrom.type;
		}
	}

	idSelector(id: string) {
		return id ? `#${id}` : "";
	}

	selectorFor(startFrom: FindElementDetails): string {
		const parentSelector = this.parentSelector(startFrom);
		const mainSelector = this.mainSelector(startFrom);
		const subSelector = startFrom.selector;
		const { id, parentId } = startFrom;
		const idSel = id ? this.idSelector(id) : '';
		const parentIdSel = parentId ? this.idSelector(parentId) : '';
		return `${parentSelector}${parentIdSel} ${mainSelector}${idSel}${subSelector}`;
	}

	async findElement(startFrom: FindElementDetails) {
		const selector = this.selectorFor(startFrom);
		const { content } = startFrom;

		const handle = await this.page?.$(selector);
		if (!handle) {
			return;
		}
		const found = await handle.evaluate((element: Element) => {
			if (content && this.matchesContent(element, content)) {
				return;
			}
			return element;
		});
		return found ? handle : undefined;
	}

	async elementScreenshot() {
		if (!this.startFrom) {
			return;
		}
		const element = await this.findElement(this.startFrom);
		if (!element) {
			this.addToMessage("Element for screenshot could not be found");
			return;
		}
		await element.screenshot(this.screenshotOptions);

		return true;
	}
}
