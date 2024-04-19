import fs from "node:fs";
import type { IAgentDriver, StructuredMsg } from "./agent-driver";
import {
	FunctionResponseHandler,
	type IFunctionResponseHandler,
} from "./handlers/function-handler";
import {
	ContentResponseHandler,
	type IContentResponseHandler,
} from "./handlers/content-handler";
import type { DebugOpts } from "../../types";
import { PageScraper, type IPageScraper } from "./document";

export interface IStepRunner {
	// noContent: boolean;
	run(linksAndInputs: any, element?: any): Promise<void>;
	noContent: boolean;
}

export type IStepRunnerOpts = DebugOpts & {
	//
};

export class StepRunner {
	step: any;
	driver: IAgentDriver;
	debug = false;
	opts: IStepRunnerOpts;
	noContent = false;
	functionHandler: IFunctionResponseHandler;
	contentHandler: IContentResponseHandler;
	pageScraper: IPageScraper;

	constructor(driver: IAgentDriver, opts: IStepRunnerOpts = {}) {
		this.driver = driver;
		this.opts = opts;
		this.debug = Boolean(opts.debug);
		this.functionHandler = this.createFunctionHandler();
		this.contentHandler = this.createContentHandler();
		this.pageScraper = this.createPageScraper();
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

	public async run(
		step: any,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		linksAndInputs: any,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		element?: any,
	) {
		this.initState(step);
		this.performStep();
		this.performInteraction();
		this.logContext();
		await this.run(step, linksAndInputs, element);
	}

	get context() {
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

	protected async performStep() {
		await this.doStepAsFunction();
		this.doStepAsContent();
	}

	protected async doStepAsFunction() {
		await this.functionHandler.handle(this.step);
	}

	protected async doStepAsContent() {
		await this.contentHandler.handle(this.step);
	}

	protected async performInteraction() {
		this.ensurePageContent();
		this.setPageUrl();
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

	get page() {
		return this.driver.page;
	}

	get messageBuilder() {
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
