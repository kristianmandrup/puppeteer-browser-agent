import type { HTTPResponse, Page } from "puppeteer";
import { AgentBrowser } from "../browser.js";
import fs from 'node:fs'
import type { DebugOpts } from "../../types.js";
import { ElementSelector } from "../../elements/selector.js";
import type { IDriverAction } from "./actions/base-action.js";
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type Context = any[]

export type FnArgs = Record<string, string>
export type DriverOpts = DebugOpts

export class AgentDriver {
	browser: AgentBrowser;
	page?: Page	
	message?: string
	contextLengthLimit = 4000
	chatMsg?: string
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	fn?: any
	fnName = ""
	fnArgs: FnArgs = {}
	autopilot = false
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	aiMsg?: any
	debug = false
	noContent = false

	context?: string
	elementSelector?: ElementSelector

	actions: Record<string, IDriverAction> = {}

	constructor(opts: DriverOpts = {}) {
		this.debug = Boolean(opts.debug);
		this.browser = new AgentBrowser();
	}

	registerAction(label: string, action: IDriverAction) {
		this.actions[label] = action
	}

	removeAction(label: string) {
		delete this.actions[label]
	}

	async run(context: string, response: HTTPResponse) {
		this.context = context
		this.page = await this.browser.start();
		if (!this.page) {
			throw new Error('No page')
		}
		this.initialize()
		await this.doStep(context, response, [], null);

		this.browser.close();
	}

	initialize() {		
		if (!this.page) {
			throw new Error('No page')
		}
		this.elementSelector = new ElementSelector(this.page)
	}

	protected parseArgs() {
		const fn = this.fn
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

	performAction(fnName: string) {
		if (fnName === "make_plan") {
			this.communicateMessage("OK. Please continue according to the plan");
		} else if (fnName === "read_file") {
			this.readFile();
		} else if (fnName === "goto_url") {
			this.gotoUrl();
		} else if (fnName === "click_link") {
			this.clickLink()
		} else if (fnName === "type_text") {
			this.typeText()
		} else if (fnName === "answer_user") {
			this.answerUser()
		} else {
			this.communicateMessage("That is an unknown function. Please call another one");
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
			return false
		}
		this.fn = nextStep.function_call;
		this.fnName = this.fn.name;
			
		this.parseArgs()
		this.performAction(this.fnName)
		return true
	}

	printCurrentCost() {
		// use OpenAI calculator class
	}

	get autopilotOn() {
		return this.autopilot
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	async notFunction(nextStep: any) {
		this.printCurrentCost();

		let nextContent = nextStep.content.trim();

		if (nextContent === "") {
			nextContent = "<empty response>";
		}
		await this.setAiMessage(nextContent)
	}

	async createMessage(content: string) {
		if (this.autopilotOn) {
			return await this.getInput(
				`<!_RESPONSE_!>${JSON.stringify(content)}\n`,
			);
		} 
		// biome-ignore lint/style/useTemplate: <explanation>
		return await this.getInput("GPT: " + content + "\nYou: ");

	}

	// TODO: override
	// biome-ignore lint/suspicious/useAwait: <explanation>
	async getInput(msg: string) {
		return msg
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	async setAiMessage(nextContent: string) {
		this.message = await this.createMessage(nextContent)
		this.aiMsg = {
			role: "user",
			content: this.message,
		};				
	}

	// override
	sendMessage(msg: string) {
		console.info('send', msg)
	}

	async doStep(
		context: string,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		nextStep: any,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		linksAndInputs: any,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		element: any,
	) {
		this.noContent = false;

		this.doFunction(nextStep) || this.notFunction(nextStep)
		this.performInteraction()
		this.logInfo()

		await this.doStep(context, nextStep, linksAndInputs, element);
	}

	logInfo() {
		if (!this.debug) {
			return
		}
		fs.writeFileSync("context.json", JSON.stringify(this.context, null, 2));
	}

	hasContent() {
		return !this.noContent
	}

	performInteraction() {
		if (!this.hasContent()) {
			const pageContent = await getPageContent(page);
			msg.content += `\n\n${pageContent.substring(0, context_length_limit)}`;
		}

		msg.url = await page.url();

		nextStep = await sendContextualMessage(msg, context);

		(msg.content = message), context.push(msg);
		context.push(nextStep);
	}

	// TODO
	async sendContextualMessage(msg: any, context: any) {

	}

	gotoUrl() {
		this.actionFor('goto_url').execute()
	}	

	findAction(label: string): IDriverAction {
		const action = this.actions[label]
		if (!action) {
			throw new Error(`Action ${label} is not registered`)
		}
		return action
	}

	actionFor(label: string) {
		return this.findAction(label)
	}

	typeText() {
		this.actionFor('type_text').execute()
	}

	answerUser() {
		this.actionFor('answer_user').execute()
	}

	clickLink() {
		this.actionFor('click_link').execute()
	}
}
