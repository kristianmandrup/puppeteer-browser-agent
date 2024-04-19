import cheerio from "cheerio";
import type { Element } from "cheerio";
import type { IAgentDriver } from "../agent";
import type { DebugOpts } from "../types";
const $ = cheerio;

export type ObjType = Record<string, string | undefined>;

export interface ITagBuilder {
	build(element: Element): any;
}

export class TagBuilder implements ITagBuilder {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	element: any;

	tagName?: string;
	value?: string;
	role?: string;
	type?: string;
	id?: string;

	tag?: string;
	title?: string;
	href?: string;
	placeholder?: string;
	textContent?: string;
	obj: ObjType = {};
	driver: IAgentDriver;
	opts: DebugOpts;

	constructor(driver: IAgentDriver, opts: DebugOpts = {}) {
		this.driver = driver;
		this.opts = opts;
	}

	initialize() {
		const { element } = this;
		this.tagName = element.name;
		this.value = this.getAttrValue("value");
		this.role = this.getAttrValue("role");
		this.type = this.getAttrValue("type");
		this.id = this.getAttrValue("pgpt-id");
	}

	getAttrValue(name: string) {
		return $(this.element).attr(name);
	}

	build(element: Element) {
		this.element = element;
		this.setTag();
		return this.createObj();
	}

	createObj() {
		const { tag, textContent, tagName } = this;

		const obj: ObjType = {
			tag: tag,
		};

		if (textContent) {
			obj.text = textContent;
			obj.tag += `${textContent}</${tagName}>`;
		}
		this.obj = obj;
		return obj;
	}

	setTag() {
		this.setPlaceholder();
		this.setHref();
		this.setTextContent();
		this.setTitle();

		const { tagName, href, type, placeholder, title, role, value, id } = this;

		let tag = `<${tagName}`;

		if (href) {
			tag += ` href="${href}"`;
		}
		if (type) {
			tag += ` type="${type}"`;
		}
		if (placeholder) {
			tag += ` placeholder="${placeholder}"`;
		}
		if (title) {
			tag += ` title="${title}"`;
		}
		if (role) {
			tag += ` role="${role}"`;
		}
		if (value) {
			tag += ` value="${value}"`;
		}
		if (id) {
			tag += ` pgpt-id="${id}"`;
		}

		tag += ">";
		this.tag = tag;
	}

	setTextContent() {
		const element = this.element;
		let textContent = $(element).text().replace(/\s+/g, " ").trim();

		if (textContent && textContent.length > 200) {
			textContent = `${textContent.substring(0, 200)}[..]`;
		}
		this.textContent = textContent;
	}

	setPlaceholder() {
		const element = this.element;
		let placeholder = this.getAttrValue("placeholder");

		if (placeholder && placeholder.length > 32) {
			placeholder = `${placeholder.substring(0, 32)}[..]`;
		}
		this.placeholder = placeholder;
	}

	setTitle() {
		const element = this.element;
		let title = this.getAttrValue("title");
		if (title && title.length > 32) {
			title = `${title.substring(0, 32)}[..]`;
		}
		this.title = title;
	}

	setHref() {
		const element = this.element;
		let href = this.getAttrValue("href");
		if (href && href.length > 32) {
			href = `${href.substring(0, 32)}[..]`;
		}
		this.href = href;
	}
}
