import type { Element, CheerioAPI } from "cheerio";
import { HtmlFormatter } from "./html-formatter";
import { ElementHandler } from "./element-handler";

export class DocumentTraverser {
	html: string;
	$: CheerioAPI;

	constructor(html: string) {
		this.html = html;
		this.$ = this.formatHtml(`<body>${html}</body>`);
	}

	formatHtml(bodyHtml: string) {
		const formatter = this.createFormatter(bodyHtml);
		return formatter.format();
	}

	createFormatter(html: string) {
		return new HtmlFormatter(html);
	}

	execute() {
		const body = this.$("body");
		if (!body) {
			throw new Error("HTML page is missing Body");
		}
		const rootElem = body[0];
		if (!rootElem) {
			throw new Error("Body invalid");
		}
		return this.traverse(rootElem);
	}

	traverse(element: Element) {
		return new ElementHandler(element, this).handle();
	}
}
