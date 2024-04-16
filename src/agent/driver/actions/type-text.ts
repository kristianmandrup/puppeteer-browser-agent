import { BaseDriverAction, IDriverAction } from "./base-action";

export interface IGotoUrlAction extends IDriverAction {}

export class GotoUrlAction extends BaseDriverAction {
	async execute() {
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
				if (tagName === "BUTTON" || type === "submit" || type === "button") {
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
}
