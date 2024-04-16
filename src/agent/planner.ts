import type { HTTPResponse } from "puppeteer";
import fs from "node:fs";
import { AgentDriver } from "./driver";
import type { DebugOpts } from "../types";
import {
	type IMessageSender,
	MessageSender,
} from "./driver/message/message-sender";

export type ActionConfig = {
	action: string;
	arguments: string[];
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
}

export class AgentPlanner implements IAgentPlanner {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	context: any[];
	// TODO: agent response?
	response?: any;
	assignedMsg?: AssignedMsg;
	promptMessage?: string;
	promptText?: string;
	driver?: AgentDriver;
	debug: boolean;
	msg = {};
	acceptPlan?: string;
	autopilot = false;
	messageSender?: IMessageSender;
	model: string;
	opts: PlannerOpts;

	constructor(context: unknown[], opts: PlannerOpts = {}) {
		this.context = context || this.createInitialContext();
		this.opts = opts;
		this.debug = Boolean(opts.debug);
		this.opts = opts;
		this.model = opts.model || "gpt-3.5";
		this.createMessageSender();
	}

	public async runPlan() {
		// TODO
		this.response = await this.getResponse();

		this.addMessageToContext(this.msg);
		this.addResponseToContext(this.response);
		this.logContext();

		const args = JSON.parse(this.response.function_call.arguments);
		this.handleArgs(args);
		await this.handleAcceptPlan;
	}

	protected createMessageSender() {
		this.messageSender = new MessageSender(this.model, this.opts);
	}

	protected createInitialContext() {
		return defaultSystemContext;
	}

	// TODO: fix
	protected isPlanAccepted(): boolean {
		return true;
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

		await this.createDriver();
		await this.startDriver();
		await this.driver?.run(this.context, this.response);

		this.browser?.close();
	}

	protected createDriver() {
		this.driver = new AgentDriver(this.opts);
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
		// send chat message
		// async function send_chat_message(
		// 	message,
		// 	context,
		// 	function_call = "auto",
		// 	functions = null
		//   ) {
		// 	let messages = [...context];
		const actionConfig: ActionConfig = {
			action: "make_plan",
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

	// TODO
	protected async getResponse() {
		return {};
	}

	protected async handleAcceptPlan() {
		if (this.autopilot) {
			this.acceptPlan = "y";
			return;
		}
		this.acceptPlan = await this.getInput(
			"Do you want to continue with this plan? (y/n): ",
		);
	}

	protected getInput(prompt: string) {
		return "ok";
	}

	protected handleArgs(args: any) {
		this.print("\n## PLAN ##");
		this.print(args.plan);
		this.print("## PLAN ##\n");
	}

	protected print(data: any) {
		console.info(data);
	}
}
