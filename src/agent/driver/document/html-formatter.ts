import cheerio, { type CheerioAPI } from "cheerio";

export class HtmlFormatter {
	html: string;
	$: CheerioAPI;

	constructor(html: string) {
		this.html = html;
	}

	load() {
		const html = this.html.replace(/<\//g, " </");
		this.$ = cheerio.load(html);
	}
	get prioritySelectors() {
		return [
			"main",
			'[role="main"]',
			"#bodyContent",
			"#search",
			"#searchform",
			".kp-header",
		];
	}

	format() {
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
