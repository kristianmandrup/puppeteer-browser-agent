import cheerio, { type CheerioAPI } from "cheerio";

export interface IHtmlFormatter {
	format(): any;
}

export class HtmlFormatter implements IHtmlFormatter {
	html: string;
	$: CheerioAPI;

	constructor(html: string) {
		this.html = html;
		const cleanHtml = this.html.replace(/<\//g, " </");
		this.$ = cheerio.load(cleanHtml);
	}

	protected get prioritySelectors() {
		return [
			"main",
			'[role="main"]',
			"#bodyContent",
			"#search",
			"#searchform",
			".kp-header",
		];
	}

	public format() {
		const $ = this.$;
		$("script, style").remove();

		// move important content to top
		// biome-ignore lint/complexity/noForEach: <explanation>
		this.prioritySelectors.forEach((selector: string) => {
			// biome-ignore lint/correctness/noUnusedVariables: <explanation>
			$(selector).each((i, el) => {
				$(el).prependTo("body");
			});
		});
		return $;
	}
}
