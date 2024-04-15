import type { HTTPResponse } from "puppeteer";
import fs from "node:fs";
import { AgentDriver } from "./driver";
import type { DebugOpts } from "../types";

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

export class AgentPlanner {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	context: any[];
	// TODO: agent response?
	response?: any;
	assignedMsg?: AssignedMsg;
	promptMessage?: string;
	promptText?: string;
	driver?: AgentDriver;
	opts: DebugOpts;
	debug: boolean;
	msg: any = {};
	acceptPlan?: string;
	autopilot = false;

	constructor(context: unknown[], opts: DebugOpts = {}) {
		this.context = context || this.createInitialContext();
		this.opts = opts;
		this.debug = Boolean(opts.debug);
	}

	createInitialContext() {
		return defaultSystemContext;
	}

	// TODO: fix
	isPlanAccepted(): boolean {
		return true;
	}

	async start() {
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

	createDriver() {
		this.driver = new AgentDriver(this.opts);
	}

	async startDriver() {
		await this.driver?.start();
	}

	get browser() {
		return this.driver?.browser;
	}

	logContext() {
		if (!this.debug) {
			return;
		}
		fs.writeFileSync("context.json", JSON.stringify(this.context, null, 2));
	}

	addToContext(item: unknown) {
		this.context.push(item);
	}

	addMessageToContext(msg: unknown) {
		this.addToContext(msg);
	}

	addResponseToContext(response: HTTPResponse) {
		this.addToContext(response);
	}

	async getAgentResponse() {
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

	sendMessageToController(msg: any, context: any, actionConfig: any) {
		//
	}

	// TODO
	async getResponse() {
		return {};
	}

	async runPlan() {
		// TODO
		this.response = await this.getResponse();

		this.addMessageToContext(this.msg);
		this.addResponseToContext(this.response);
		this.logContext();

		const args = JSON.parse(this.response.function_call.arguments);
		this.handleArgs(args);
		await this.handleAcceptPlan;
	}

	async handleAcceptPlan() {
		if (this.autopilot) {
			this.acceptPlan = "y";
			return;
		}
		this.acceptPlan = await this.getInput(
			"Do you want to continue with this plan? (y/n): ",
		);
	}

	getInput(prompt: string) {
		return "ok";
	}

	handleArgs(args: any) {
		this.print("\n## PLAN ##");
		this.print(args.plan);
		this.print("## PLAN ##\n");
	}

	print(data: any) {
		console.info(data);
	}
}
