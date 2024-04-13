import cheerio, { Element, type CheerioAPI } from "cheerio";
import { HtmlFormatter } from "./html-formatter";

export class DocumentTraverser {
	html: string;
	$: CheerioAPI;

	constructor(html: string) {
		this.$ = this.formatHtml(`<body>${html}</body>`);
	}

	formatHtml(bodyHtml: string) {
		const formatter = this.createFormatter(bodyHtml);
		return formatter.format();
	}

	createFormatter(html: string) {
		return new HtmlFormatter(html);
	}

	traverse(element: Element) {
		let output = "";
		const children = element.children;

		if ($(element).is("h1, h2, h3, h4, h5, h6")) {
			output += `<${element.name}>`;
		}

		if ($(element).is("form")) {
			// biome-ignore lint/style/useTemplate: <explanation>
			output += "\n<" + element.name + ">\n";
		}

		if ($(element).is("div, section, main")) {
			output += "\n";
		}

		let the_tag = make_tag(element);

		if ($(element).attr("pgpt-id")) {
			output += " " + (the_tag.tag ? the_tag.tag : "");
		} else if (element.type === "text" && !$(element.parent).attr("pgpt-id")) {
			output += " " + element.data.trim();
		}

		if (children) {
			children.forEach((child) => {
				output += traverse(child);
			});
		}

		if ($(element).is("h1, h2, h3, h4, h5, h6")) {
			output += "</" + element.name + ">";
		}

		if ($(element).is("form")) {
			output += "\n</" + element.name + ">\n";
		}

		if ($(element).is("h1, h2, h3, h4, h5, h6, div, section, main")) {
			output += "\n";
		}

		return output
			.replace(/[^\S\n]+/g, " ")
			.replace(/ \n+/g, "\n")
			.replace(/[\n]+/g, "\n");
	}

	execute() {
		const body = this.$("body");
		if (!body) {
			throw new Error("HTML page is missing Body");
		}
		const firstElem = body[0];
		if (!firstElem) {
			throw new Error("Body invalid");
		}
		return this.traverse(firstElem);
	}
}
