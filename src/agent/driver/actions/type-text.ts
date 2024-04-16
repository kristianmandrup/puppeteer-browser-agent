import { ElementHandle } from "puppeteer";
import { BaseDriverAction, IDriverAction } from "./base-action";

export interface IGotoUrlAction extends IDriverAction {}

export class GotoUrlAction extends BaseDriverAction {
	formData: any;
	prevInput: any;

	async selectElement(elementSelector: string) {
		return await this.page?.$(elementSelector);
	}

	async getElementAttr(element: ElementHandle<Element>, attrName: string) {
		return await element.evaluate((el) => {
			const val = el.getAttribute(attrName);
			return val ?? "";
		});
	}

	async getElementType(element: ElementHandle<Element>) {
		return await this.getElementAttr(element, "type");
	}

	async getElementName(element: ElementHandle<Element>) {
		return await this.getElementAttr(element, "name");
	}

	async getElementTagName(element: ElementHandle<Element>) {
		return await element.evaluate((el) => {
			return el.tagName;
		});
	}

	onSubmittable(tagName: string, type?: string) {
		if (tagName === "BUTTON" || type === "submit" || type === "button") {
			this.fnArgs.submit = true;
			return true;
		}
		return false;
	}

	async onIputField(element: ElementHandle, data: any) {
		const name = this.getElementName(element);
		const text = data.text;
		this.prevInput = element;
		await element.type(data.text);
		const sanitized = text.replace("\n", " ");
		this.log(`${this.taskPrefix}Typing "${sanitized}" to ${name}`);
		this.addToMessage(`Typed "${text}" to input field "${name}"\n`);
	}

	resetMessage() {
		this.message = "";
	}

	addToMessage(message: string) {
		this.message += message;
	}

	async execute() {
		const { fnArgs } = this;
		this.formData = fnArgs.form_data;

		for (const data of this.formData) {
			const elementId = data.pgpt_id;

			this.resetMessage();

			try {
				const elementSelector = `.pgpt-element${elementId}`;
				const element = await this.selectElement(elementSelector);
				if (!element) {
					throw new Error(`No such element on page: ${elementSelector}`);
				}
				if (!this.prevInput) {
					this.prevInput = element;
				}

				const type = await this.getElementType(element);
				const tagName = await this.getElementTagName(element);

				// ChatGPT sometimes tries to type empty string
				// to buttons to click them
				this.onSubmittable(tagName, type) ||
					(await this.onIputField(element, data));
			} catch (error) {
				this.log(error);

				this.addToMessage(
					`Error typing "${data.text}" to input field ID ${data.element_id}\n`,
				);
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
