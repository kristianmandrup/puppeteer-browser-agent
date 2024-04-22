import type { PuppeteerLifeCycleEvent } from "puppeteer";
import type { IDriverAction } from "../base-action";
import type { DebugOpts } from "../../../../types";
import { ElementAction } from "../element-action";
import {
	type ISearchResult,
	PresearchAdapter,
	type ISearchEngineAdapter,
} from "./presearch-adapter";

export interface ISearchAction extends IDriverAction {}

export type QueryFn = (query: string) => string;

export type SearchOpts = DebugOpts & {};

export type SearchEngineRegistry = Record<string, QueryFn>;

export class SearchAction extends ElementAction implements ISearchAction {
	waitUntil: PuppeteerLifeCycleEvent = "load";
	name = "search";
	defaultEngine = "presearch";
	searchEngines: SearchEngineRegistry = {
		google: (query: string) => `https://google.com/search?q=${query}`,
		presearch: (query: string) => `https://presearch.com/search?q=${query}`,
		bing: (query: string) => `https://www.bing.com/search?q${query}`,
	};
	searchResults?: ISearchResult[] = [];
	adapters: Record<string, ISearchEngineAdapter> = {};

	registerDefaultAdapters() {
		if (!this.page) {
			return;
		}
		const presearch = new PresearchAdapter(this.page);
		this.registerAdapter("presearch", presearch);
	}

	registerAdapter(key: string, adapter: ISearchEngineAdapter) {
		this.adapters[key] = adapter;
	}

	get query() {
		return this.fnArgs.query;
	}

	get searchEngineName() {
		const name = this.fnArgs.searchEngine;
		return name ? name.toLowerCase() : this.defaultEngine;
	}

	get searchEngine(): QueryFn | undefined {
		return this.searchEngines[this.searchEngineName];
	}

	get adapter() {
		return this.adapters[this.searchEngineName];
	}

	get queryUrl() {
		if (!this.searchEngine) {
			throw new Error("Invalid search engine configuration");
		}
		return this.searchEngine(this.query);
	}

	onStart() {
		this.logTask(`Searching ${this.searchEngineName} for ${this.query}`);
	}

	async execute() {
		this.onStart();
		if (!this.page) {
			throw new Error("Missing page");
		}
		try {
			await this.gotoUrl(this.queryUrl);
		} catch (error: any) {
			this.setMessage(
				`Error searching with ${this.queryUrl}: ${error.message}`,
			);
		}
		this.onStartScraping();
		this.searchResults = await this.getSearchResults();
	}

	async gotoUrl(url: string) {
		const { waitUntil } = this;
		await this.page?.goto(url, {
			waitUntil,
		});
	}

	onStartScraping() {
		this.logTask("Scraping page...");
	}

	protected async getSearchResults() {
		if (!this.page) {
			throw new Error("Missing page");
		}
		return await this.adapter?.getSearchResults();
		// return await this.elementSelector?.getSearchResults(this.page);
	}
}
