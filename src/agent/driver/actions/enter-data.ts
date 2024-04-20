import type { ElementHandle } from "puppeteer";
import type { IDriverAction } from "./base-action";
import { PageNavigator, type IPageNavigator } from "../document";
import type { IAgentDriver } from "../agent-driver";
import type { DebugOpts } from "../../../types";
import { ElementAction } from "./element-action";

export interface IEnterDataAction extends IDriverAction {}

export type TSelectAttrs = {
	multiple: boolean;
	options: HTMLOptionsCollection;
	selectedIndex: number;
	selectedOptions: HTMLCollectionOf<HTMLOptionElement>;
};
export interface IElementDetails {
	type: string;
	tagName: string;
}
export class EnterDataFormAction
	extends ElementAction
	implements IEnterDataAction
{
	formData: any;
	prevInput: any;
	// linksAndInputs: ElementHandle<Element>[] = [];
	navigator: IPageNavigator;
	taskName = "enter_data";

	constructor(driver: IAgentDriver, opts: DebugOpts = {}) {
		super(driver, opts);
		this.navigator = this.createNavigator();
	}

	protected createNavigator() {
		return new PageNavigator(this.driver, this.opts);
	}

	async selectElement(elementCssSelector: string) {
		return await this.page?.$(elementCssSelector);
	}

	async getElementAttr(element: ElementHandle<Element>, attrName: string) {
		return await element.evaluate((el: Element) => {
			const val = el.getAttribute(attrName);
			return val ?? "";
		});
	}

	async getSelectElementAttr(element: ElementHandle<Element>) {
		return await element.evaluate((el: Element) => {
			const sel = el as HTMLSelectElement;
			const opts = sel.options;
			const selectedIndex = sel.selectedIndex;
			const selectedOptions = sel.selectedOptions;
			const multiple = sel.multiple;
			return { options: opts, selectedIndex, selectedOptions, multiple };
		});
	}

	async getElementChecked(element: ElementHandle<Element>) {
		return await this.getElementAttr(element, "checked");
	}

	async getElementType(element: ElementHandle<Element>) {
		return await this.getElementAttr(element, "type");
	}

	async getElementName(element: ElementHandle<Element>) {
		return await this.getElementAttr(element, "name");
	}

	async getElementTagName(element: ElementHandle<Element>) {
		return await element.evaluate((el: Element) => {
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

	async onTextInputField(
		element: ElementHandle,
		{ type }: IElementDetails,
		data: any,
	) {
		if (type === "input") {
			await this.typeTextIn(element, data);
		}
	}

	protected hasMatchingOption(options: HTMLOptionsCollection, data: any) {
		return Array.from(options).find(
			(opt: HTMLOptionElement) => opt.label === data.text,
		);
	}

	async onSelectField(
		element: ElementHandle,
		{ tagName }: IElementDetails,
		data: any,
	) {
		if (tagName !== "SELECT") {
			return;
		}
		const sel: TSelectAttrs = await this.getSelectElementAttr(element);
		if (this.hasMatchingOption(sel.options, data)) {
			await this.selectOptionsOn(element, sel, data);
		}
	}

	isRadioField({ type, tagName }: IElementDetails) {
		return tagName === "INPUT" && type === "radio";
	}

	async onRadioField(
		element: ElementHandle,
		elemDetails: IElementDetails,
		data: any,
	) {
		if (!this.isRadioField(elemDetails)) {
			return;
		}
		const checked = await this.getElementChecked(element);
		await this.checkRadioOn(element, Boolean(checked), data);
	}

	async onFormField(
		element: ElementHandle,
		elemDetails: IElementDetails,
		data: any,
	) {
		await this.onTextInputField(element, elemDetails, data);
		await this.onSelectField(element, elemDetails, data);
		await this.onRadioField(element, elemDetails, data);
	}

	get checkAnswers() {
		return ["yes", "y", "check", "x"];
	}

	get uncheckAnswers() {
		return ["no", "n", "uncheck"];
	}

	async checkRadioOn(element: ElementHandle, checked: boolean, data: any) {
		const text = data.text;
		if (!checked && this.checkAnswers.includes(text)) {
			await element.click();
		}
		if (checked && this.uncheckAnswers.includes(text)) {
			await element.click();
		}
	}

	unselectSelected(select: TSelectAttrs) {
		if (!select.multiple) {
			return;
		}
		for (const opt of Array.from(select.selectedOptions)) {
			opt.selected = false;
		}
	}

	async selectOptionsOn(
		element: ElementHandle,
		select: TSelectAttrs,
		data: any,
	) {
		if (select.multiple) {
			const options = data.text.split(",");
			for (const opt of options) {
				await element.select(opt);
			}
			return;
		}
		const text = data.text;
		await element.select(text);
	}

	async typeTextIn(element: ElementHandle, data: any) {
		const name = this.getElementName(element);
		const text = data.text;
		this.prevInput = element;
		await element.type(data.text);
		const sanitized = text.replace("\n", " ");
		this.log(`${this.taskPrefix}Typing "${sanitized}" to ${name}`);
		this.addToMessage(`Typed "${text}" to input field "${name}"\n`);
	}

	pgptElementSelectorFor(id: string) {
		return `.pgpt-element${id}`;
	}

	async getPgptElementById(id: string) {
		const selector = this.pgptElementSelectorFor(id);
		return await this.selectElement(selector);
	}

	setElement(element: ElementHandle<Element>) {
		this.element = element;
	}

	public async execute() {
		const { fnArgs } = this;
		this.formData = fnArgs.form_data;

		for (const data of this.formData) {
			const id = data.pgpt_id;

			this.resetMessage();

			try {
				const selector = this.pgptElementSelectorFor(id);
				const element = await this.selectElement(selector);
				if (!element) {
					throw new Error(`No such element on page: ${selector}`);
				}
				this.setElement(element);
				if (!this.prevInput) {
					this.prevInput = element;
				}

				const type = await this.getElementType(element);
				const tagName = await this.getElementTagName(element);
				const elemDetails = {
					type,
					tagName,
				};
				// ChatGPT sometimes tries to type empty string
				// to buttons to click them
				this.onSubmittable(tagName, type) ||
					(await this.onFormField(element, elemDetails, data));
			} catch (error) {
				this.log(error);
				this.addToMessage(
					`Error typing "${data.text}" to input field ID ${data.element_id}\n`,
				);
			}
		}
		this.onSubmit();
	}

	protected async waitForNavigation() {
		if (!this.page) {
			throw new Error("Missing page");
		}
		return await this.navigator.waitForNavigation(this.page);
	}

	protected async onSubmit() {
		if (!this.fnArgs.submit) {
			return;
		}
		this.log(`${this.taskPrefix}Submitting form`);

		try {
			this.handleForm();
			const url = this.getPageUrl();
			this.addToMessage(`Form sent! You are now on ${url}\n`);
		} catch (error) {
			this.onSubmitFormError(error);
		}

		this.log(`${this.taskPrefix}Scraping page...`);
		this.setLinksAndInputs(await this.getTabbableElements());
	}

	setLinksAndInputs(elements: ElementHandle<Element>[]) {
		this.driver.setLinksAndInputs(elements);
	}

	async getPageUrl() {
		return await this.page?.url();
	}

	async handleForm() {
		const form = await this.prevInput.evaluateHandle((input: any) =>
			input.closest("form"),
		);

		await form.evaluate((form: any) => form.submit());
		await this.waitForNavigation();
	}

	onSubmitFormError(error: any) {
		this.log(error);
		this.log(`${this.taskPrefix}Error submitting form`);
		this.addToMessage("There was an error submitting the form.\n");
	}
}
