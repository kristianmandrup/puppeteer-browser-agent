import fs from "node:fs";
import type { HTTPResponse, Page } from "puppeteer";
import { AgentBrowser, type IAgentBrowser } from "../agent-browser.js";
import { actionDefinitions } from "./definitions.js";
import {
	ElementSelector,
	type IElementSelector,
} from "../../elements/element-selector.js";
import type { IDriverAction } from "./actions/base-action.js";
import { type IPageScraper, PageScraper } from "./document/page-scraper.js";
import {
	type IMessageBuilder,
	MessageBuilder,
} from "./message/message-builder.js";
import type { DebugOpts } from "../../types.js";
import {
	TerminalInputController,
	type IInputController,
} from "./input/cli-input.js";
import {
	type IMessageSender,
	MessageSender,
} from "./message/message-sender.js";
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type Context = any[];
export type StructuredMsg = {
	content: string;
	url: string;
};

export type FnArgs = Record<string, any>;
export type DriverOpts = DebugOpts & {
	definitions?: any[];
};

export interface IAgentDriver {
	registerAction(action: IDriverAction, id?: string): void;
	removeAction(id: string): void;
	start(): Promise<void>;
	closeBrowser(): void;
	run(context: string[], response: HTTPResponse): Promise<void>;
	doStep(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		linksAndInputs: any,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		element: any,
	): Promise<void>;
	setMessage(msg: string): void;
	addToMessage(message: string): void;
	getInput(msg: string): Promise<string>;
	page?: Page;
	elementSelector: IElementSelector;
	autopilot: boolean;
	browser: IAgentBrowser;
	model: string;
	definitions: any[];
	setDefinitions(definitions: any[]): void;
	addDefinitions(definitions: any[]): void;
	inputController: IInputController;
	log(msg: any): void;
	messageSender: IMessageSender;
	noContent: boolean;
}

export class AgentDriver implements IAgentDriver {
	browser: AgentBrowser;
	page?: Page;
	message?: string;
	contextLengthLimit = 4000;
	chatMsg?: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	fn?: any;
	fnName = "";
	fnArgs: FnArgs = {};
	autopilot = false;
	model = "gpt-3.5";
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	aiMsg?: any;
	debug = false;
	noContent = false;
	nextStep: any;

	context?: string[] = [];
	elementSelector: IElementSelector;
	messageBuilder: IMessageBuilder;
	inputController: IInputController;
	messageSender: IMessageSender;

	actions: Record<string, IDriverAction> = {};
	pageScraper: IPageScraper;
	definitions: any[];
	opts: DriverOpts;

	constructor(opts: DriverOpts = {}) {
		this.opts = opts;
		this.debug = Boolean(opts.debug);
		this.browser = this.createAgentBrowser();
		if (!this.page) {
			throw new Error("No page");
		}
		this.definitions = opts.definitions || this.defaultDefinitions();
		this.elementSelector = this.createElementSelector();
		this.pageScraper = this.createPageScraper();
		this.messageBuilder = this.createMessageBuilder();
		this.messageSender = this.createMessageSender();
		this.inputController = this.createInputController();
	}

	public setDefinitions(definitions: any[]) {
		this.definitions = definitions;
	}

	public addDefinition(definition: any, overwrite = false) {
		if (!definition) {
			return;
		}
		if (Array.isArray(definition)) {
			this.addDefinitions(definition, overwrite);
			return;
		}
		this.addDefinitions([definition], overwrite);
	}

	public addDefinitions(definitions: any[], overwrite = false) {
		for (const definition of definitions) {
			if (overwrite || !this.definitions.includes(definition)) {
				this.definitions.push(definition);
			}
		}
	}

	defaultDefinitions() {
		return actionDefinitions;
	}

	createDefaultInputReader() {
		return {
			question: async (text: string) => text,
		};
	}

	public registerAction(action: IDriverAction, id?: string) {
		const actionId = id || action.name;
		this.actions[actionId] = action;
		if (action.definition) {
			this.addDefinition(action.definition);
		}
	}

	public removeAction(id: string) {
		delete this.actions[id];
	}

	public async start() {
		this.initialize();
		this.page = await this.openBrowserPage();
	}

	public async run(context: string[], response: HTTPResponse) {
		this.context = context;
		this.nextStep = response;
		await this.doStep([]);
		this.closeBrowser();
	}

	public closeBrowser() {
		this.browser.close();
	}

	public log(msg: any) {
		if (!this.debug) {
			return;
		}
		console.info(msg);
	}

	protected initialize() {
		this.log("initializing...");
	}

	protected createMessageSender() {
		return new MessageSender(this, this.opts);
	}

	protected createInputController() {
		return new TerminalInputController(this.createDefaultInputReader);
	}

	protected createMessageBuilder() {
		return new MessageBuilder();
	}

	protected createElementSelector() {
		return new ElementSelector(this);
	}

	protected createAgentBrowser() {
		return new AgentBrowser(this);
	}

	protected async openBrowserPage() {
		return await this.browser.start();
	}

	protected parseArgs() {
		const fn = this.fn;
		try {
			return JSON.parse(fn.arguments);
		} catch (e) {
			if (this.fnName === "answer_user") {
				return {
					answer: fn.arguments,
				};
			}
		}
	}

	protected handleAction(actionName: string) {
		this.performAction(actionName) || this.defaultAction();
	}

	protected defaultAction() {
		this.communicateMessage(
			"That is an unregistered or invalid action. Please use a valid one",
		);
	}

	protected findAction(id: string): IDriverAction {
		const action = this.actions[id];
		if (!action) {
			throw new Error(`Action ${id} is not registered`);
		}
		return action;
	}

	protected performAction(actionId: string) {
		try {
			const action = this.findAction(actionId);
			action.setState({ args: this.fnArgs, context: this.context });
			action.execute();
			return true;
		} catch (err: any) {
			this.log(err.message || `Action error ${actionId}`);
			return false;
		}
	}

	protected communicateMessage(msg: string) {
		let message = msg;
		message = message.substring(0, this.contextLengthLimit);
		this.chatMsg = msg ?? {
			role: "function",
			name: this.fnName,
			content: JSON.stringify({
				status: "OK",
				message: message,
			}),
		};
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	protected doStepAsFunction(nextStep: any) {
		if (!this.isFunctionCallStep(nextStep)) {
			return false;
		}
		this.setFunctionAttributes(nextStep);
		this.performAction(this.fnName);
	}

	setFunctionAttributes(nextStep: any) {
		this.fn = nextStep.function_call;
		this.fnName = this.fn.name;
		this.fnArgs = this.parseArgs();
	}

	isFunctionCallStep(step: any) {
		return step.function_call;
	}

	protected printCurrentCost() {
		// use OpenAI calculator class
	}

	protected get autopilotOn() {
		return this.autopilot;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	protected async doStepAsContent(nextStep: any) {
		if (this.isFunctionCallStep(nextStep)) {
			return;
		}
		this.printCurrentCost();
		let nextContent = nextStep.content.trim();

		if (nextContent === "") {
			nextContent = "<empty response>";
		}
		await this.setAiMessage(nextContent);
	}

	protected async createMessage(content: string) {
		if (this.autopilotOn) {
			return await this.getInput(`<!_RESPONSE_!>${JSON.stringify(content)}\n`);
		}
		// biome-ignore lint/style/useTemplate: <explanation>
		return await this.getInput("GPT: " + content + "\nYou: ");
	}

	public async getInput(prompt: string) {
		return await this.inputController.getInput(prompt);
	}

	public addToMessage(message: string) {
		this.message += message;
	}

	// override
	public setMessage(message: string) {
		this.message = message;
		console.info("send", message);
	}

	public async doStep(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		linksAndInputs: any,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		element?: any,
	) {
		this.noContent = false;
		this.performStep(this.nextStep);
		this.performInteraction();
		this.logContext();
		await this.doStep(linksAndInputs, element);
	}

	protected performStep(step: any) {
		this.doStepAsFunction(step);
		this.doStepAsContent(step);
	}

	protected async setAiMessage(nextContent: string) {
		this.message = await this.createMessage(nextContent);
		this.aiMsg = {
			role: "user",
			content: this.message,
		};
	}

	protected createPageScraper() {
		return new PageScraper(this);
	}

	protected logContext() {
		if (!this.debug) {
			return;
		}
		fs.writeFileSync("context.json", JSON.stringify(this.context, null, 2));
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

	protected addPageContent(pageContent: string) {
		const content = `\n\n${pageContent.substring(0, this.contextLengthLimit)}`;
		this.messageBuilder.addContent(content);
	}

	protected get msg(): StructuredMsg {
		return this.messageBuilder.message;
	}

	protected async performInteraction() {
		this.ensurePageContent();
		this.setPageUrl();
		await this.getNextStep();
		this.updateContext();
	}

	async ensurePageContent() {
		if (!this.hasContent()) {
			const pageContent = await this.getPageContent();
			this.addPageContent(pageContent);
		}
	}

	updateContext() {
		this.addToContext(this.msg);
		this.addToContext(this.nextStep);
	}

	async getNextStep() {
		const response = await this.sendContextualMessage(this.msg, this.context);
		this.messageBuilder.setContent(this.message);
		this.nextStep = response;
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

	async sendContextualMessage(
		structuredMsg: StructuredMsg,
		context: any,
		actionConfig = {
			name: "auto",
		},
	) {
		await this.messageSender.sendMessageToController(
			structuredMsg,
			context,
			actionConfig,
		);
	}
}
