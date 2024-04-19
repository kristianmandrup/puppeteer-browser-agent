import type { IAgentDriver } from "../agent";
import type { DebugOpts } from "../types";

export class ElementEvaluator {
	element?: Element;
	id: number;
	selector: string;
	role?: string | null = "null";
	placeholder?: string;
	textContent?: string;
	type?: string;
	value?: string;
	href?: string;
	title?: string;
	driver: IAgentDriver;
	debug: boolean;
	opts: DebugOpts;
	maxAttrLength = 32;

	constructor(
		driver: IAgentDriver,
		element: any,
		id: number,
		selector: string,
		opts: DebugOpts = {},
	) {
		this.driver = driver;
		this.element = element;
		this.id = id;
		this.selector = selector;
		this.debug = Boolean(opts.debug);
		this.opts = opts;
	}

	evaluate() {
		if (this.ignoreElement()) {
			return;
		}
		this.configureElement();
		return this.element;
	}

	protected configureElement() {
		this.addMarkerClass();
		this.externalRefElem();
		this.elemRole();
		this.formElement();
		this.titledElement();
		this.text();
	}

	protected addMarkerClass() {
		this.element?.classList.add(`pgpt-element${this.id}`);
	}

	protected elemRole() {
		this.role = this.element?.role;
	}

	protected titledElement() {
		const element = this.element as HTMLAnchorElement;
		this.title = element.title;
	}

	protected externalRefElem() {
		const element = this.element as HTMLAnchorElement;
		this.href = this.sliceOff(element.href);
	}

	protected formElement() {
		const element = this.element as HTMLFormElement;
		const placeholder = element.placeholder;
		this.type = element.type;
		this.value = element.value;
		this.placeholder = this.sliceOff(placeholder);
	}

	protected text() {
		const textContent = this.textContent;
		let title = this.title;
		if (!textContent && title) {
			title = this.sliceOff(title);
		}
		this.textContent = this.sliceOff(textContent, 200);
		this.title = title;
	}

	protected sliceOff(text?: string, length?: number) {
		const maxLength = this.maxAttrLength || length || 32;
		return text && text.length > maxLength
			? `${text.substring(0, maxLength)}[..]`
			: text;
	}

	ignoreElement() {
		const element = this.element;
		if (!element) {
			throw new Error("Missing element");
		}
		if (!element.matches(this.selector)) {
			return true;
		}

		const tagName = element.tagName;
		if (tagName === "BODY") {
			return true;
		}

		const textContent = this.trimWhiteSpaces(element.textContent);
		if (textContent === "" && !element.matches("select, input, textarea")) {
			return true;
		}
		return false;
	}

	trimWhiteSpaces(textContent: string | null) {
		return textContent ? textContent?.replace(/\s+/g, " ").trim() : "";
	}
}
