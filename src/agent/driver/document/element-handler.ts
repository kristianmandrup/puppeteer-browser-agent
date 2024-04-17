import type { Element } from "cheerio";
import type { DocumentTraverser } from "./doc-traverser";
import { TagBuilder } from "../../../elements";

export interface IElementHandler {
	handle(): void;
}

export class ElementHandler implements IElementHandler {
	element: Element;
	docTraverser: DocumentTraverser;
	output = "";

	constructor(element: Element, docTraverser: DocumentTraverser) {
		this.element = element;
		this.docTraverser = docTraverser;
	}

	public handle() {
		this.handleMisc();
		this.handleHeaderElement();
		this.handleFormElement();
		this.handleSections();
		this.handleHeadersAndSectionElements();
		return this.formatOutput();
	}

	protected get $() {
		return this.docTraverser.$;
	}

	protected addToOutput(text: string) {
		this.output += text;
	}

	protected handleHeaderElement() {
		const { $, element } = this;
		if ($(element).is("h1, h2, h3, h4, h5, h6")) {
			this.addToOutput(`<${element.name}>`);
		}
	}

	protected handleFormElement() {
		const { $, element } = this;
		if ($(element).is("form")) {
			this.addToOutput(`\n<${element.name}>\n`);
		}
	}

	protected handleSections() {
		const { $, element } = this;
		if ($(element).is("div, section, main")) {
			this.addToOutput("\n");
		}
	}

	protected handleHeadersAndSectionElements() {
		const { $, element } = this;
		if ($(element).is("h1, h2, h3, h4, h5, h6, div, section, main")) {
			this.addToOutput("\n");
		}
	}

	protected makeTag(element: Element) {
		return this.createTagBuilder(element).build();
	}

	protected createTagBuilder(element: Element) {
		return new TagBuilder(element);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	protected handleSpecialAttr(elemTag: any) {
		const { $, element } = this;
		if ($(element).attr("pgpt-id")) {
			this.addToOutput(` ${elemTag.tagName ? elemTag.tagName : ""}`);
			return true;
		}
		return false;
	}

	protected handleNonSpecialTag() {
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

	protected handleMisc() {
		const elemTag = this.makeTag(this.element);
		this.handleSpecialAttr(elemTag) || this.handleNonSpecialTag();
	}

	protected traverse(element: Element) {
		return this.docTraverser.traverse(element);
	}

	protected handleChildren() {
		const children = this.element.children;
		if (children) {
			// biome-ignore lint/complexity/noForEach: <explanation>
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			children.forEach((child: any) => {
				this.addToOutput(this.traverse(child));
			});
		}
	}

	protected formatOutput() {
		return this.output
			.replace(/[^\S\n]+/g, " ")
			.replace(/ \n+/g, "\n")
			.replace(/[\n]+/g, "\n");
	}
}
