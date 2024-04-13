import type { HTTPResponse, Page } from "puppeteer";
import { AgentBrowser } from "./browser.js";

export class AgentDriver {
	browser: AgentBrowser;

	constructor() {
		this.browser = new AgentBrowser();
	}

	async run(context: string, response: HTTPResponse) {
		const page = await this.browser.start();
		await this.doStep(page, context, response, [], null);

		this.browser.close();
	}

	protected parseArgs() {
		try {
			fnArgs = JSON.parse(fn.arguments);
		} catch (e) {
			if (fnName === "answer_user") {
				fnArgs = {
					answer: fn.arguments,
				};
			}
		}
	}

	performAction() {
		if (fnName === "make_plan") {
			message = "OK. Please continue according to the plan";
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
			message = "That is an unknown function. Please call another one";
		}		
	}	

	doFunction() {
		if (!nextStep.hasOwnProperty("function_call")) return
		let fn = nextStep.function_call;
		let fnName = fn.name;
		let fnArgs;
			
		this.parseArgs()
		this.performAction()


		message = message.substring(0, context_length_limit);
		msg = msg ?? {
			role: "function",
			name: fnName,
			content: JSON.stringify({
				status: "OK",
				message: message,
			}),
		};
	}

	notAFunction() {
		print_current_cost();

		let next_content = nextStep.content.trim();

		if (next_content === "") {
			next_content = "<empty response>";
		}

		if (autopilot) {
			message = await input(
				"<!_RESPONSE_!>" + JSON.stringify(next_content) + "\n",
			);
		} else {
			message = await input("GPT: " + next_content + "\nYou: ");
			print();
		}

		msg = {
			role: "user",
			content: message,
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
		let message;
		let msg;
		let noContent = false;

		this.doFunction() || this.notAFunction()
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
		let link_id = fnArgs.pgpt_id;
		let link_text = fnArgs.text;

		if (!link_id) {
			message = "ERROR: Missing parameter pgpt_id";
		} else if (!link_text) {
			message = "";
			context.pop();
			msg = {
				role: "user",
				content:
					"Please the correct link on the page. Remember to set both the text and the pgpt_id parameter.",
			};
		} else {
			const link = linksAndInputs.find(
				(elem) => elem && elem.id == link_id,
			);

			try {
				print(task_prefix + `Clicking link "${link.text}"`);

				request_count = 0;
				response_count = 0;
				download_started = false;

				if (!page.$(".pgpt-element" + link_id)) {
					throw new Error("Element not found");
				}

				page.click(".pgpt-element" + link_id);

				await wait_for_navigation(page);

				let url = await page.url();

				if (download_started) {
					download_started = false;
					message = "Link clicked and file download started successfully!";
					noContent = true;
				} else {
					message = "Link clicked! You are now on " + url;
				}
			} catch (error) {
				if (debug) {
					print(error);
				}
				if (error instanceof TimeoutError) {
					message = "NOTICE: The click did not cause a navigation.";
				} else {
					let link_text = link ? link.text : "";

					message = `Sorry, but link number ${link_id} (${link_text}) is not clickable, please select another link or another command. You can also try to go to the link URL directly with "goto_url".`;
				}
			}
		}

		print(task_prefix + "Scraping page...");
		linksAndInputs = await get_tabbable_elements(page);
	}
}
