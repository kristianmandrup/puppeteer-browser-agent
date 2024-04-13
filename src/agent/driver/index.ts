import type { HTTPResponse, Page } from "puppeteer";
import { AgentBrowser } from "../browser.js";
import fs from 'node:fs'
import { DebugOpts } from "../../types.js";

export type FnArgs = Record<string, string>
export type DriverOpts = DebugOpts

export class AgentDriver {
	browser: AgentBrowser;	
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

	constructor(opts: DriverOpts = {}) {
		this.debug = Boolean(opts.debug);
		this.browser = new AgentBrowser();
	}

	async run(context: string, response: HTTPResponse) {
		const page = await this.browser.start();
		await this.doStep(page, context, response, [], null);

		this.browser.close();
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

	async doStep(
		page: Page,
		context: string,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		nextStep: any,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		linksAndInputs: any,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		element: any,
	) {
		let noContent = false;

		this.doFunction(nextStep) || this.notFunction(nextStep)
		this.performInteraction()
		this.logInfo()

		await this.doStep(page, context, nextStep, linksAndInputs, element);
	}

	logInfo() {
		if (!this.debug) {
			return
		}
		fs.writeFileSync("context.json", JSON.stringify(context, null, 2));
	}

	performInteraction() {
		if (noContent !== true) {
			const page_content = await get_page_content(page);
			msg.content += "\n\n" + page_content.substring(0, context_length_limit);
		}

		msg.url = await page.url();

		nextStep = await send_chat_message(msg, context);

		(msg.content = message), context.push(msg);
		context.push(nextStep);

	}

	async shouldReadFile() {
		return (
			autopilot ||
			(await input(
				"\nGPT: I want to read the file " +
					filename +
					"\nDo you allow this? (y/n): ",
			)) == "y"
		);
	}

	async readFile() {
		let filename = fnArgs.filename;
		if (await this.shouldReadFile()) {
			print();
			print(task_prefix + "Reading file " + filename);

			if (fs.existsSync(filename)) {
				let file_data = fs.readFileSync(filename, "utf-8");
				file_data = file_data.substring(0, context_length_limit);
				message = file_data;
			} else {
				message = "ERROR: That file does not exist";
			}
		} else {
			print();
			message = "ERROR: You are not allowed to read this file";
		}
	}

	gotoUrl() {
		let url = fnArgs.url;

		print(task_prefix + "Going to " + url);

		try {
			await page.goto(url, {
				waitUntil: wait_until,
			});

			url = await page.url();

			message = `You are now on ${url}`;
		} catch (error) {
			message = check_download_error(error);
			message = message ?? "There was an error going to the URL";
		}

		print(task_prefix + "Scraping page...");
		linksAndInputs = await get_tabbable_elements(page);
	}	

	typeText() {
		let form_data = fnArgs.form_data;
		let prev_input;

		for (let data of form_data) {
			let element_id = data.pgpt_id;
			let text = data.text;

			message = "";

			try {
				element = await page.$(".pgpt-element" + element_id);

				if (!prev_input) {
					prev_input = element;
				}

				const name = await element.evaluate((el) => {
					return el.getAttribute("name");
				});

				const type = await element.evaluate((el) => {
					return el.getAttribute("type");
				});

				const tagName = await element.evaluate((el) => {
					return el.tagName;
				});

				// ChatGPT sometimes tries to type empty string
				// to buttons to click them
				if (
					tagName === "BUTTON" ||
					type === "submit" ||
					type === "button"
				) {
					fnArgs.submit = true;
				} else {
					prev_input = element;
					await element.type(text);
					let sanitized = text.replace("\n", " ");
					print(task_prefix + `Typing "${sanitized}" to ${name}`);
					message += `Typed "${text}" to input field "${name}"\n`;
				}
			} catch (error) {
				if (debug) {
					print(error);
				}
				message += `Error typing "${text}" to input field ID ${data.element_id}\n`;
			}
		}

		if (fnArgs.submit !== false) {
			print(task_prefix + `Submitting form`);

			try {
				const form = await prev_input.evaluateHandle((input) =>
					input.closest("form"),
				);

				await form.evaluate((form) => form.submit());
				await wait_for_navigation(page);

				let url = await page.url();

				message += `Form sent! You are now on ${url}\n`;
			} catch (error) {
				if (debug) {
					print(error);
				}
				print(task_prefix + `Error submitting form`);
				message += "There was an error submitting the form.\n";
			}

			print(task_prefix + "Scraping page...");
			linksAndInputs = await get_tabbable_elements(page);
		}
	}

	answerUser() {
		let text = fnArgs.answer;

		if (!text) {
			text = fnArgs.summary;
		}

		print_current_cost();

		if (autopilot) {
			message = await input("<!_RESPONSE_!>" + JSON.stringify(text) + "\n");
		} else {
			message = await input("\nGPT: " + text + "\nYou: ");
		}

		print();
	}

	clickLink() {
	}
}
