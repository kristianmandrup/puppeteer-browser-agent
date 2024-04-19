import fs from "node:fs";
import type { IAgentDriver, StructuredMsg } from "./agent-driver";
import { FunctionResponseHandler } from "./handlers/function-handler";
import { ContentResponseHandler } from "./handlers/content-handler";
import type { DebugOpts } from "../../types";
import { PageScraper, type IPageScraper } from "./document";
import type { IResponseHandler } from "./handlers/base-handler";
import type { ElementHandle } from "puppeteer";

export interface IStepRunner {
	// noContent: boolean;
	run(step: any): Promise<void>;
	noContent: boolean;
	element?: ElementHandle<Element>;
	linksAndInputs: ElementHandle<Element>[];
	clearHandlers(): void;
	registerHandler(handler: IResponseHandler): void;
}

export type IStepRunnerOpts = DebugOpts & {
	//
};

export class StepRunner {
	step: any;
	element?: ElementHandle<Element>;
	linksAndInputs: ElementHandle<Element>[] = [];
	driver: IAgentDriver;
	debug = false;
	opts: IStepRunnerOpts;
	noContent = false;
	handlers: IResponseHandler[] = [];
	pageScraper: IPageScraper;
	domElement?: Element;

	constructor(driver: IAgentDriver, opts: IStepRunnerOpts = {}) {
		this.driver = driver;
		this.opts = opts;
		this.debug = Boolean(opts.debug);
		this.handlers = this.defaultHandlers();
		this.pageScraper = this.createPageScraper();
	}

	public clearHandlers() {
		this.handlers = [];
	}

	public registerHandler(handler: IResponseHandler) {
		this.handlers.push(handler);
	}

	public async run(step: any) {
		this.initState(step);
		await this.handleStep();
		await this.prepareNextStep();
		this.logContext();
		await this.doNextStep();
	}

	protected async doNextStep() {
		await this.run(this.step);
	}

	protected defaultHandlers() {
		return [this.createFunctionHandler(), this.createContentHandler()];
	}

	protected createPageScraper() {
		return new PageScraper(this.driver);
	}

	protected createFunctionHandler() {
		return new FunctionResponseHandler(this.driver, this.opts);
	}

	protected createContentHandler() {
		return new ContentResponseHandler(this.driver, this.opts);
	}

	protected get context() {
		return this.driver.context;
	}

	protected logContext() {
		if (!this.debug) {
			return;
		}
		fs.writeFileSync("context.json", JSON.stringify(this.context, null, 2));
	}

	protected initState(step: any) {
		this.step = step;
		this.noContent = false;
	}

	protected async handleStep() {
		for await (const handler of this.handlers) {
			await handler.handle(this.step);
		}
	}

	protected async getPageData() {
		await this.ensurePageContent();
		await this.setPageUrl();
	}

	protected async prepareNextStep() {
		await this.getPageData();
		await this.getNextStep();
		this.updateContext();
	}

	protected async ensurePageContent() {
		if (!this.hasContent()) {
			const pageContent = await this.getPageContent();
			this.addPageContent(pageContent);
		}
	}

	protected hasContent() {
		return !this.noContent;
	}

	protected async getPageContent() {
		if (!this.page) {
			throw new Error("Missing page for scraping");
		}
		return await this.pageScraper.getPageContent(this.page);
	}

	protected get page() {
		return this.driver.page;
	}

	protected get messageBuilder() {
		return this.driver.messageBuilder;
	}

	protected addPageContent(pageContent: string) {
		const content = `\n\n${pageContent.substring(0, this.contextLengthLimit)}`;
		this.messageBuilder.addContent(content);
	}

	get contextLengthLimit() {
		return this.driver.contextLengthLimit;
	}

	protected updateContext() {
		this.addToContext(this.structuredMsg);
		this.addToContext(this.step);
	}

	get structuredMsg() {
		return this.driver.structuredMsg;
	}

	get message() {
		return this.driver.message;
	}

	async getNextStep() {
		const response = await this.getControllerResponse(
			this.structuredMsg,
			this.context,
		);
		this.messageBuilder.setContent(this.message);
		this.step = response;
	}

	async getControllerResponse(
		structuredMsg: StructuredMsg,
		context: any,
		actionConfig = {
			name: "auto",
		},
	) {
		return await this.driver.getControllerResponse(
			structuredMsg,
			context,
			actionConfig,
		);
	}

	async setPageUrl() {
		const url = await this.getPageUrl();
		url && this.messageBuilder.setUrl(url);
	}

	async getPageUrl() {
		return await this.page?.url();
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	addToContext(data: any) {
		this.context?.push(data);
	}
}
