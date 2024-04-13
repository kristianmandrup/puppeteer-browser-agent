import type { Element } from "cheerio";
import type { DocumentTraverser } from "./doc-traverser";
import { TagBuilder } from "../../../elements";

export class ElementHandler {
	element: Element;
	docTraverser: DocumentTraverser;
	output = "";

	constructor(element: Element, docTraverser: DocumentTraverser) {
		this.element = element;
		this.docTraverser = docTraverser;
	}

	get $() {
		return this.docTraverser.$;
	}

	addToOutput(text: string) {
		this.output += text;
	}

	handleHeaderElement() {
		const { $, element } = this;
		if ($(element).is("h1, h2, h3, h4, h5, h6")) {
			this.addToOutput(`<${element.name}>`);
		}
	}

	handleFormElement() {
		const { $, element } = this;
		if ($(element).is("form")) {
			this.addToOutput(`\n<${element.name}>\n`);
		}
	}

	handleSections() {
		const { $, element } = this;
		if ($(element).is("div, section, main")) {
			this.addToOutput("\n");
		}
	}

	handleHeadersAndSectionElements() {
		const { $, element } = this;
		if ($(element).is("h1, h2, h3, h4, h5, h6, div, section, main")) {
			this.addToOutput("\n");
		}
	}

	makeTag(element: Element) {
		return this.createTagBuilder(element).build();
	}

	createTagBuilder(element: Element) {
		return new TagBuilder(element);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	handleSpecialAttr(elemTag: any) {
		const { $, element } = this;
		if ($(element).attr("pgpt-id")) {
			this.addToOutput(` ${elemTag.tagName ? elemTag.tagName : ""}`);
			return true;
		}
		return false;
	}

	handleNonSpecialTag() {
		const { $, element } = this;
		const parent = element?.parent;
		if (element.type === "tag" && parent && !$(parent).attr("pgpt-id")) {
			this.addToOutput(
				` ${
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					(element as any).data?.trim()
				}`,
			);
			return true;
		}
		return false;
	}

	handleMisc() {
		const elemTag = this.makeTag(this.element);
		this.handleSpecialAttr(elemTag) || this.handleNonSpecialTag();
	}

	traverse(element: Element) {
		return this.docTraverser.traverse(element);
	}

	handleChildren() {
		const children = this.element.children;
		if (children) {
			// biome-ignore lint/complexity/noForEach: <explanation>
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			children.forEach((child: any) => {
				this.addToOutput(this.traverse(child));
			});
		}
	}

	formatOutput() {
		return this.output
			.replace(/[^\S\n]+/g, " ")
			.replace(/ \n+/g, "\n")
			.replace(/[\n]+/g, "\n");
	}

	handle() {
		this.handleMisc();
		this.handleHeaderElement();
		this.handleFormElement();
		this.handleSections();
		this.handleHeadersAndSectionElements();
		return this.formatOutput();
	}
}
