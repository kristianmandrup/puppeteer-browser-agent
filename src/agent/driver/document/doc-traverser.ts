import type { Element, CheerioAPI } from "cheerio";
import { HtmlFormatter, type IHtmlFormatter } from "./html-formatter";
import { ElementTypeHandler } from "./element-handler";
import type { IAgentDriver } from "../driver";

export class DocumentTraverser {
	html: string;
	$: CheerioAPI;
	driver: IAgentDriver;
	formatter: IHtmlFormatter;

	constructor(driver: IAgentDriver, html: string) {
		this.driver = driver;
		this.html = html;
		this.formatter = this.createFormatter();
		this.$ = this.formatHtml(`<body>${html}</body>`);
	}

	formatHtml(bodyHtml: string) {
		return this.formatter.format(bodyHtml);
	}

	createFormatter() {
		return new HtmlFormatter(this.driver);
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
		return new ElementTypeHandler(this.driver, this).handle(element);
	}
}
