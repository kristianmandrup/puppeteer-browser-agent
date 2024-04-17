import cheerio, { type CheerioAPI } from "cheerio";
import type { DebugOpts } from "../../../types";

export interface IHtmlFormatter {
	format(html: string): CheerioAPI;
}

export class HtmlFormatter implements IHtmlFormatter {
	html?: string;
	$?: CheerioAPI;
	debug: boolean;

	constructor(opts: DebugOpts = {}) {
		this.debug = Boolean(opts.debug);
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

	public format(html: string) {
		this.html = html;
		const cleanHtml = this.html.replace(/<\//g, " </");
		this.$ = cheerio.load(cleanHtml);
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
