import type { ElementHandle } from "puppeteer";
import { BaseDriverAction, type IDriverAction } from "./base-action";
import { PageNavigator, type IPageNavigator } from "../document";
import type { FnArgs, IAgentDriver } from "../agent-driver";
import type { DebugOpts } from "../../../types";

export interface ISumbitFormAction extends IDriverAction {}

export class SubmitFormAction
	extends BaseDriverAction
	implements ISumbitFormAction
{
	formData: any;
	prevInput: any;
	linksAndInputs: any;
	navigator: IPageNavigator;

	constructor(
		driver: IAgentDriver,
		fnArgs: FnArgs,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		context: any[],
		opts: DebugOpts = {},
	) {
		super(driver, fnArgs, context, opts);
		this.navigator = this.createNavigator();
	}

	protected createNavigator() {
		return new PageNavigator(this.driver, this.opts);
	}

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

	public async execute() {
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
		this.onSubmit();
	}

	// TODO
	protected async waitForNavigation() {
		await this.navigator.waitForNavigation;
	}

	protected async onSubmit() {
		if (!this.fnArgs.submit) {
			return;
		}
		this.log(`${this.taskPrefix}Submitting form`);

		try {
			const form = await this.prevInput.evaluateHandle((input: any) =>
				input.closest("form"),
			);

			await form.evaluate((form: any) => form.submit());
			await this.waitForNavigation();

			const url = await this.page?.url();

			this.addToMessage(`Form sent! You are now on ${url}\n`);
		} catch (error) {
			this.onSubmitFormError(error);
		}

		this.log(`${this.taskPrefix}Scraping page...`);
		this.linksAndInputs = await this.getTabbableElements();
	}

	// TODO
	async getTabbableElements() {}

	onSubmitFormError(error: any) {
		this.log(error);
		this.log(`${this.taskPrefix}Error submitting form`);
		this.addToMessage("There was an error submitting the form.\n");
	}
}
