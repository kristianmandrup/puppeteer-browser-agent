import { type Element, type CheerioAPI, load } from "cheerio";
import { HtmlFormatter, type IHtmlFormatter } from "./html-formatter";
import {
	ElementTypeHandler,
	type IElementTypeHandler,
} from "./element-type-handler";
import type { IAgentDriver } from "../agent-driver";
import type { DebugOpts } from "../../../types";

export interface IDocumentTraverser {
	$: CheerioAPI;
	start(html: string): string;
	traverse(element: Element): string;
}

export class DocumentTraverser implements IDocumentTraverser {
	html?: string;
	$: CheerioAPI = load("");
	driver: IAgentDriver;
	formatter: IHtmlFormatter;
	debug: boolean;
	opts: DebugOpts;
	elementTypeHandler: IElementTypeHandler;

	constructor(driver: IAgentDriver, opts: DebugOpts = {}) {
		this.driver = driver;
		this.opts = opts;
		this.debug = Boolean(opts.debug);
		this.formatter = this.createFormatter();
		this.elementTypeHandler = this.createElementTypeHandler();
	}

	createElementTypeHandler() {
		return new ElementTypeHandler(this.driver, this);
	}

	formatHtml(bodyHtml: string) {
		return this.formatter.format(bodyHtml);
	}

	createFormatter() {
		return new HtmlFormatter(this.driver);
	}

	initialize(html: string) {
		this.html = html;
		this.$ = this.formatHtml(`<body>${html}</body>`);
	}

	start(html: string) {
		this.initialize(html);
		const { $ } = this;
		const body = $("body");
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
		return this.elementTypeHandler.handle(element);
	}
}
