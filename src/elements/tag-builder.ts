import cheerio, { load } from "cheerio";
const $ = cheerio;

type Obj = Record<string, string | undefined>;

export class TagBuilder {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	element: any;

	tagName: string;
	value?: string;
	role?: string;
	type?: string;
	id?: string;

	tag?: string;
	title?: string;
	href?: string;
	placeholder?: string;
	textContent?: string;
	obj: Obj = {};

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	constructor(element: any) {
		this.element = element;
		this.tagName = element.name;
		this.value = $(element).attr("value");
		this.role = $(element).attr("role");
		this.type = $(element).attr("type");
		this.id = $(element).attr("pgpt-id");
	}

	build() {
		this.setTag();
		return this.createObj();
	}

	createObj() {
		const { tag, textContent, tagName } = this;

		const obj: Obj = {
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
		let placeholder = $(element).attr("placeholder");

		if (placeholder && placeholder.length > 32) {
			placeholder = `${placeholder.substring(0, 32)}[..]`;
		}
		this.placeholder = placeholder;
	}

	setTitle() {
		const element = this.element;
		let title = $(element).attr("title");
		if (title && title.length > 32) {
			title = `${title.substring(0, 32)}[..]`;
		}
		this.title = title;
	}

	setHref() {
		const element = this.element;
		let href = $(element).attr("href");
		if (href && href.length > 32) {
			href = `${href.substring(0, 32)}[..]`;
		}
		this.href = href;
	}
}
