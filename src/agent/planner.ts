import type { HTTPResponse } from "puppeteer";
import fs from "node:fs";
import { AgentDriver } from "./driver";

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
	assignedMsg?: AssignedMsg;
	promptMessage?: string;
	promptText?: string;
	driver?: AgentDriver;

	constructor(context: unknown[], driver: AgentDriver) {
		this.context = context || this.createInitialContext();
		this.driver = driver;
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

		const page = await this.driver.startBrowser();
		await this.driver.dostep(page, context, response, [], null);

		this.browser?.close();
	}

	get browser() {
		return this.driver?.browser;
	}

	logContext() {
		if (!debug) {
			return;
		}
		fs.writeFileSync("context.json", JSON.stringify(context, null, 2));
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

	async runPlan() {
		response = await this.driver.sendContextualMessage(msg, context, {
			name: "make_plan",
			arguments: ["plan"],
		});

		this.addMessageToContext(msg);
		this.addResponseToContext(response);
		this.logContext();

		let args = JSON.parse(response.function_call.arguments);

		print("\n## PLAN ##");
		print(args.plan);
		print("## PLAN ##\n");

		if (autopilot) {
			accept_plan = "y";
		} else {
			accept_plan = await input(
				"Do you want to continue with this plan? (y/n): ",
			);
		}
	}
}
