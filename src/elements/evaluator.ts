export class ElementEvaluator {
	element: Element;
	id: number;
	selector: string;
	obj = 1;

	role: string | null = "null";
	placeholder?: string;
	textContent?: string;
	type?: string;
	value?: string;
	href?: string;
	title?: string;

	constructor(element: Element, id: number, selector: string) {
		this.element = element;
		this.id = id;
		this.selector = selector;
	}

	evaluate() {
		if (this.ignoreElement()) {
			return;
		}
		this.element.classList.add(`pgpt-element${this.id}`);
		return this.element;
	}

	configure() {
		const element = this.element;
		this.role = element.role;
	}

	titledElement() {
		const element = this.element as HTMLAnchorElement;
		this.title = element.title;
	}

	externalRefElem() {
		const element = this.element as HTMLAnchorElement;
		let href = element.href;

		if (href && href.length > 32) {
			// biome-ignore lint/style/useTemplate: <explanation>
			href = href.substring(0, 32) + "[..]";
		}
		this.href = href;
	}

	formElement() {
		const element = this.element as HTMLFormElement;
		let placeholder = element.placeholder;
		this.type = element.type;
		this.value = element.value;

		if (placeholder && placeholder.length > 32) {
			// biome-ignore lint/style/useTemplate: <explanation>
			placeholder = placeholder.substring(0, 32) + "[..]";
		}
		this.placeholder = placeholder;
	}

	text() {
		let textContent = this.textContent;
		let title = this.title;
		if (!textContent && title && title.length > 32) {
			title = `${title.substring(0, 32)}[..]`;
		}
		if (textContent && textContent.length > 200) {
			textContent = `${textContent.substring(0, 200)}[..]`;
		}
		this.textContent = textContent;
		this.title = title;
	}

	ignoreElement() {
		const element = this.element;
		if (!element.matches(this.selector)) {
			return true;
		}

		const tagName = element.tagName;
		if (tagName === "BODY") {
			return true;
		}

		const textContent = element.textContent?.replace(/\s+/g, " ").trim();
		if (textContent === "" && !element.matches("select, input, textarea")) {
			return true;
		}
		return false;
	}
}
