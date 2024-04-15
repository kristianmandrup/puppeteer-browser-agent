import type { HTTPResponse, Page } from "puppeteer";
import { AgentBrowser } from "../browser.js";
import fs from "node:fs";
import type { DebugOpts } from "../../types.js";
import { ElementSelector } from "../../elements/selector.js";
import type { IDriverAction } from "./actions/base-action.js";
import { PageScraper } from "./document/page-scraper.js";
import { MessageBuilder } from "./message/message-builder.js";
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type Context = any[];
export type StructuredMsg = {
	content: string;
	url: string;
};

export type FnArgs = Record<string, string>;
export type DriverOpts = DebugOpts;

export class AgentDriver {
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
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	aiMsg?: any;
	debug = false;
	noContent = false;

	context?: string[] = [];
	elementSelector?: ElementSelector;
	messageBuilder: MessageBuilder = new MessageBuilder();

	actions: Record<string, IDriverAction> = {};

	constructor(opts: DriverOpts = {}) {
		this.debug = Boolean(opts.debug);
		this.browser = new AgentBrowser();
	}

	registerAction(label: string, action: IDriverAction) {
		this.actions[label] = action;
	}

	removeAction(label: string) {
		delete this.actions[label];
	}

	async start() {
		this.page = await this.browser.start();
		if (!this.page) {
			throw new Error("No page");
		}
	}

	async run(context: string[], response: HTTPResponse) {
		this.context = context;
		this.initialize();
		await this.doStep(context, response, [], null);

		this.browser.close();
	}

	initialize() {
		if (!this.page) {
			throw new Error("No page");
		}
		this.elementSelector = new ElementSelector(this.page);
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

	handleAction(actionName: string) {
		this.performAction(actionName) || this.defaultAction();
	}

	defaultAction() {
		this.communicateMessage(
			"That is an unregistered or invalid action. Please use a valid one",
		);
	}

	findAction(label: string): IDriverAction {
		const action = this.actions[label];
		if (!action) {
			throw new Error(`Action ${label} is not registered`);
		}
		return action;
	}

	performAction(label: string) {
		try {
			const action = this.findAction(label);
			action.execute();
			return true;
		} catch (_err) {
			return false;
		}
	}

	communicateMessage(msg: string) {
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
	doFunction(nextStep: any) {
		if (!nextStep.function_call) {
			return false;
		}
		this.fn = nextStep.function_call;
		this.fnName = this.fn.name;

		this.parseArgs();
		this.performAction(this.fnName);
		return true;
	}

	printCurrentCost() {
		// use OpenAI calculator class
	}

	get autopilotOn() {
		return this.autopilot;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	async notFunction(nextStep: any) {
		this.printCurrentCost();

		let nextContent = nextStep.content.trim();

		if (nextContent === "") {
			nextContent = "<empty response>";
		}
		await this.setAiMessage(nextContent);
	}

	async createMessage(content: string) {
		if (this.autopilotOn) {
			return await this.getInput(`<!_RESPONSE_!>${JSON.stringify(content)}\n`);
		}
		// biome-ignore lint/style/useTemplate: <explanation>
		return await this.getInput("GPT: " + content + "\nYou: ");
	}

	// TODO: override
	// biome-ignore lint/suspicious/useAwait: <explanation>
	async getInput(msg: string) {
		return msg;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	async setAiMessage(nextContent: string) {
		this.message = await this.createMessage(nextContent);
		this.aiMsg = {
			role: "user",
			content: this.message,
		};
	}

	// override
	sendMessage(msg: string) {
		console.info("send", msg);
	}

	async doStep(
		context: string[],
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		nextStep: any,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		linksAndInputs: any,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		element: any,
	) {
		this.noContent = false;

		this.doFunction(nextStep) || this.notFunction(nextStep);
		this.performInteraction();
		this.logInfo();

		await this.doStep(context, nextStep, linksAndInputs, element);
	}

	logInfo() {
		if (!this.debug) {
			return;
		}
		fs.writeFileSync("context.json", JSON.stringify(this.context, null, 2));
	}

	hasContent() {
		return !this.noContent;
	}

	get pageScraper() {
		return new PageScraper();
	}

	async getPageContent() {
		if (!this.page) {
			throw new Error("Missing page for scraping");
		}
		return await this.pageScraper.getPageContent(this.page);
	}

	addPageContent(pageContent: string) {
		const content = `\n\n${pageContent.substring(0, this.contextLengthLimit)}`;
		this.messageBuilder.addContent(content);
	}

	get msg(): StructuredMsg {
		return this.messageBuilder.message;
	}

	async performInteraction() {
		if (!this.hasContent()) {
			const pageContent = await this.getPageContent();
			this.addPageContent(pageContent);
		}
		const url = await this.page?.url();
		url && this.messageBuilder.setUrl(url);

		const nextStep = await this.sendContextualMessage(this.msg, this.context);
		this.messageBuilder.setContent(this.message);

		this.addToContext(this.msg);
		this.addToContext(nextStep);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	addToContext(data: any) {
		this.context?.push(data);
	}

	// TODO
	async sendContextualMessage(
		_structuredMsg: StructuredMsg,
		_context: string[] = [],
	) {
		//
	}
}
