import type { ElementHandle } from "puppeteer";
import { ElementAction } from "./element-action";

export type ICodeInfo = {
	title: string;
	descriptions: string[];
	codeblocks: string[];
};

export class FindCodeAction extends ElementAction {
	name = "find_code";

	get headersSelector() {
		return "h1,h2,h3,h4";
	}

	async getCodeLinesForAll(
		mainHandle: ElementHandle,
		lineSelector = "span.line",
	) {
		const codehandles = await mainHandle.$$("code");
		const results: string[] = [];
		for (const codeHandle of codehandles) {
			const lines = await this.getContentForAll(codeHandle, lineSelector);
			const code = lines.join("\n");
			results.push(code);
		}
		return results;
	}

	get lineSelector() {
		return this.fnArgs.lineSelector || "span.line";
	}

	get codeTitle() {
		return this.fnArgs.codeTitle;
	}

	async execute() {
		const headers = await this.page?.$$(this.headersSelector);
		if (!headers) {
			return;
		}
		const codeTitle = this.codeTitle;

		const results: ICodeInfo[] = [];
		for (const header of headers) {
			// TODO: refactor
			const title = await header.evaluate((el: Element) => {
				return `${el.textContent}`;
			});
			if (codeTitle && !title.toLocaleLowerCase().includes(codeTitle)) {
				continue;
			}
			const descriptions = await this.getContentForAll(header, "p");
			const codeblocks = await this.getCodeLinesForAll(
				header,
				this.lineSelector,
			);
			const result: ICodeInfo = {
				title,
				descriptions,
				codeblocks,
			};
			results.push(result);
		}
		this.addToMessage(`Code found on page:${JSON.stringify(results)}`);
	}
}
