import type { ElementHandle } from "puppeteer";
import { ElementAction } from "./element-action";
import { findCode } from "./definitions/find-code";

export type ICodeInfo = {
	title: string;
	descriptions: string;
	code: string;
};

export class FindCodeAction extends ElementAction {
	name = "find_code";
	definition = findCode;

	async getCodeLinesFor(
		codeHandle: ElementHandle,
		lineSelector = "span.line",
	) {
		return await this.getContentForAll(codeHandle, lineSelector);
	}

	get lineSelector() {
		return this.fnArgs.lineSelector || "span.line";
	}

	get codeTitle() {
		return this.fnArgs.codeTitle;
	}

	async execute() {
		const codeBlocks = await this.page?.$$('code');
		if (!codeBlocks) {
			return;
		}
		const codeTitle = this.codeTitle;

		const results: ICodeInfo[] = [];
		for (const codeBlock of codeBlocks) {
			const codeBlockElem = await this.handleToElement(codeBlock)
			const nearestHeader = this.findNearestHeadingElement(codeBlockElem)

			const title = nearestHeader?.textContent
			if (codeTitle && !title?.toLocaleLowerCase().includes(codeTitle)) {
				continue;
			}
			if (!title) {
				continue
			}
			const descriptions = await this.getRelevantTextBeforeNextHeader(codeBlockElem);
			const lines = await this.getCodeLinesFor(
				codeBlock,
				this.lineSelector,
			);
			const result: ICodeInfo = {
				title,
				descriptions: descriptions ?? undefined,
				code: lines.join('\n'),
			};
			results.push(result);
		}
		this.addToMessage(`Code found on page:${JSON.stringify(results)}`);
	}
}
