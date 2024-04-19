import type { HTTPResponse } from "puppeteer";
import fs from "node:fs";
import { AgentDriver, type IAgentDriver } from "./driver/agent-driver";
import type { DebugOpts } from "../types";
import {
	type IMessageSender,
	MessageSender,
} from "./driver/message/message-sender";

export type ActionConfig = {
	name: string;
	arguments?: string[];
};

const defaultSystemContext = [
	{
		role: "system",
		content: `
## OBJECTIVE ##
You have been tasked with crawling the internet based on a task given by the user. You are connected to a web browser which you can control via function calls to navigate to pages and list elements on the page. You can also type into search boxes and other input fields and send forms. You can also click links on the page. You will behave as a human browsing the web.

## NOTES ##
You will try to navigate directly to the most relevant web address. If you were given a URL, go to it directly. If you encounter a Page Not Found error, try another URL. If multiple URLs don't work, you are probably using an outdated version of the URL scheme of that website. In that case, try navigating to their front page and using their search bar or try navigating to the right place with links.

## WHEN TASK IS FINISHED ##
When you have executed all the operations needed for the original task, call answer_user to give a response to the user.`.trim(),
	},
];

export type AssignedMsg = {
	role: string;
	content: string;
};

export type PlannerOpts = DebugOpts & {
	model?: string;
};

export interface IAgentPlanner {
	runPlan(): Promise<void>;
	definitions: any[];
	setDefinitions(definitions: any[]): void;
	addDefinitions(definitions: any[]): void;
}

export class AgentPlanner implements IAgentPlanner {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	context: any[];
	// agent response?
	aiAgentResponse?: any;
	assignedMsg?: AssignedMsg;
	promptMessage?: string;
	promptText?: string;
	driver: IAgentDriver;
	debug: boolean;
	msg = {};
	acceptPlan?: boolean;
	autopilot = false;
	messageSender?: IMessageSender;
	model: string;
	opts: PlannerOpts;

	constructor(context: any, opts: PlannerOpts = {}) {
		this.context = context || this.createInitialContext();
		this.opts = opts;
		this.debug = Boolean(opts.debug);
		this.opts = opts;
		this.model = opts.model || "gpt-3.5";
		this.driver = this.createDriver();
		this.messageSender =
			this.driver.messageSender || this.createMessageSender();
	}

	public get definitions() {
		return this.driver.definitions;
	}

	public setDefinitions(definitions: any[]) {
		this.driver.setDefinitions(definitions);
	}

	public addDefinitions(definitions: any[]) {
		this.driver.addDefinitions(definitions);
	}

	public async runPlan() {
		// from ai agent
		this.aiAgentResponse = await this.getAgentResponse();

		this.addMessageToContext(this.msg);
		this.addResponseToContext(this.aiAgentResponse);
		this.logContext();

		const args = JSON.parse(this.aiAgentResponse.function_call.arguments);
		this.handleArgs(args);
		await this.handleAcceptPlan;
	}

	protected createMessageSender() {
		return new MessageSender(this.driver, this.opts);
	}

	protected createInitialContext() {
		return defaultSystemContext;
	}

	protected isPlanAccepted(): boolean {
		return Boolean(this.acceptPlan);
	}

	public async start() {
		this.promptMessage = `Task: ${this.promptText}.`;
		this.assignedMsg = {
			role: "user",
			content: this.promptMessage,
		};

		while (this.isPlanAccepted()) {
			await this.runPlan();
		}

		await this.startDriver();
		await this.driver?.run(this.context, this.aiAgentResponse);

		this.browser?.close();
	}

	protected createDriver() {
		return new AgentDriver(this.opts);
	}

	protected async startDriver() {
		await this.driver?.start();
	}

	protected get browser() {
		return this.driver?.browser;
	}

	protected logContext() {
		if (!this.debug) {
			return;
		}
		fs.writeFileSync("context.json", JSON.stringify(this.context, null, 2));
	}

	protected addToContext(item: unknown) {
		this.context.push(item);
	}

	protected addMessageToContext(msg: unknown) {
		this.addToContext(msg);
	}

	protected addResponseToContext(response: HTTPResponse) {
		this.addToContext(response);
	}

	protected async getAgentResponse() {
		const actionConfig: ActionConfig = {
			name: "make_plan",
			arguments: ["plan"],
		};

		// See: sendMessageToController
		return await this.sendMessageToController(
			this.msg,
			this.context,
			actionConfig,
		);
	}

	protected sendMessageToController(msg: any, context: any, actionConfig: any) {
		this.messageSender?.sendMessageToController(msg, context, actionConfig);
	}

	protected async handleAcceptPlan() {
		this.acceptPlan = this.autoAccept() || (await this.userAccept());
	}

	protected async userAccept() {
		const answer = await this.getInput(
			"Do you want to continue with this plan? (y/n): ",
		);
		return answer === "y";
	}

	protected autoAccept() {
		return this.autopilot;
	}

	protected async getInput(prompt: string) {
		return await this.driver.getInput(prompt);
	}

	protected handleArgs(args: any) {
		this.log("\n## PLAN ##");
		this.log(args.plan);
		this.log("## PLAN ##\n");
	}

	protected log(data: any) {
		this.driver.log(data);
	}
}
