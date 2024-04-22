import type { ElementHandle } from "puppeteer";
import type { IDriverAction } from "./base-action";
import { PageNavigator, type IPageNavigator } from "../document";
import type { IAgentDriver } from "../agent-driver";
import type { DebugOpts } from "../../../types";
import { ElementAction } from "./element-action";

export interface IEnterDataAction extends IDriverAction {}

export interface IFieldData {
	pp_id: string;
	text: string;
	label?: string;
	name?: string;
	select?: string[];
	index?: number;
	check: boolean;
}

export type TSelectAttrs = {
	multiple: boolean;
	options: HTMLOptionsCollection;
	selectedIndex: number;
	selectedOptions: HTMLCollectionOf<HTMLOptionElement>;
};
export interface IElementDetails {
	name: string;
	type: string;
	tagName: string;
}
export class EnterDataFormAction
	extends ElementAction
	implements IEnterDataAction
{
	formData: IFieldData[] = [];
	prevInput?: ElementHandle;
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

	async handleToElement(element: ElementHandle<Element>): Promise<Element> {
		return await element.evaluate((el: Element) => {
			return el;
		});
	}

	getElementAttr(element: Element, attrName: string) {
		const val = element.getAttribute(attrName);
		return val ?? "";
	}

	getSelectElementAttr(element: Element) {
		const sel = element as HTMLSelectElement;
		const opts = sel.options;
		const selectedIndex = sel.selectedIndex;
		const selectedOptions = sel.selectedOptions;
		const multiple = sel.multiple;
		return { options: opts, selectedIndex, selectedOptions, multiple };
	}

	getElementChecked(element: Element) {
		return this.getElementAttr(element, "checked");
	}

	getElementType(element: Element) {
		return this.getElementAttr(element, "type");
	}

	getElementName(element: Element) {
		return this.getElementAttr(element, "name");
	}

	getElementTagName(element: Element) {
		return element.tagName;
	}

	onSubmittable({ tagName, type }: IElementDetails) {
		if (tagName === "BUTTON" || type === "submit" || type === "button") {
			this.fnArgs.submit = true;
			return true;
		}
		return false;
	}

	isTextInputField({ tagName, type }: IElementDetails) {
		return tagName === "INPUT" && type === "text";
	}

	isTextAreaField({ tagName, type }: IElementDetails) {
		return tagName === "TEXTAREA";
	}

	async onTextField(
		element: ElementHandle,
		details: IElementDetails,
		data: any,
	) {
		if (this.isTextInputField(details) || this.isTextAreaField(details)) {
			await this.typeTextIn(element, details, data);
		}
	}

	protected hasMatchingOption(options: HTMLOptionsCollection, data: any) {
		return Array.from(options).find(
			(opt: HTMLOptionElement) =>
				opt.label === data.text || data.selected?.includes(opt.label),
		);
	}

	async onSelectField(
		handle: ElementHandle,
		element: Element,
		details: IElementDetails,
		data: IFieldData,
	) {
		if (details.tagName !== "SELECT") {
			return;
		}
		const sel: TSelectAttrs = await this.getSelectElementAttr(element);
		if (this.hasMatchingOption(sel.options, data)) {
			await this.selectOptionsOn(handle, details, sel, data);
		}
	}

	isRadioField({ type, tagName }: IElementDetails) {
		return tagName === "INPUT" && type === "radio";
	}

	async findTextFieldWithPlaceholder(
		selector: string,
		text: string,
	): Promise<Element | null | undefined> {
		const elementsWithText = await this.page?.$$eval(
			selector,
			(elements: Element[]) => {
				const matchedElements: Element[] = [];
				for (const element of elements) {
					const field = element as HTMLInputElement;
					if (field.placeholder?.includes(text)) {
						// element.style.border = '2px solid red'; // Highlighting matching elements
						matchedElements.push(element);
					}
				}
				return matchedElements;
			},
		);
		return elementsWithText?.[0];
	}

	async findElementWithText(
		selector: string,
		text: string,
	): Promise<Element | null | undefined> {
		const elementsWithText = await this.page?.$$eval(
			selector,
			(elements: Element[]) => {
				const matchedElements: Element[] = [];
				for (const element of elements) {
					if (element.textContent?.includes(text)) {
						// element.style.border = '2px solid red'; // Highlighting matching elements
						matchedElements.push(element);
					}
				}
				return matchedElements;
			},
		);
		return elementsWithText?.[0];
	}

	async findHandleForFieldNamed(
		name: string,
	): Promise<ElementHandle | null | undefined> {
		return await this.page?.$(
			`input[name=${name}], textarea[name=${name}], select[name=${name}]`,
		);
	}

	async onRadioField(
		handle: ElementHandle,
		element: Element,
		details: IElementDetails,
		data: IFieldData,
	) {
		if (!this.isRadioField(details)) {
			return;
		}
		const checked = await this.getElementChecked(element);
		await this.checkRadioOn(handle, details, Boolean(checked), data);
	}

	async onFormField(
		handle: ElementHandle,
		element: Element,
		details: IElementDetails,
		data: IFieldData,
	) {
		await this.onTextField(handle, details, data);
		await this.onSelectField(handle, element, details, data);
		await this.onRadioField(handle, element, details, data);
	}

	get checkAnswers() {
		return ["yes", "y", "check", "x"];
	}

	get uncheckAnswers() {
		return ["no", "uncheck"];
	}

	async clickRadio(
		handle: ElementHandle,
		details: IElementDetails,
		checked: boolean,
	) {
		const checkAction = checked ? "checked" : "unchecked";
		const name = details.name;
		this.prevInput = handle;
		await handle.click();
		this.log(`${this.taskPrefix}${checkAction} radio for ${name}`);
		this.addToMessage(`${checkAction} radio for "${name}"\n`);
	}

	async checkRadioOn(
		handle: ElementHandle,
		details: IElementDetails,
		checked: boolean,
		data: IFieldData,
	) {
		const text = data.text;
		const shouldCheck = data.check || this.checkAnswers.includes(text);
		const shouldUncheck =
			data.check === false || this.uncheckAnswers.includes(text);
		if (!checked && shouldCheck) {
			await this.clickRadio(handle, details, !checked);
		}
		if (checked && shouldUncheck) {
			await this.clickRadio(handle, details, !checked);
		}
	}

	unselectSelected(select: TSelectAttrs) {
		if (!select.multiple) {
			return;
		}
		const options = Array.from(select.selectedOptions);
		for (const option of options) {
			option.selected = false;
		}
	}

	async selectOptionsOn(
		handle: ElementHandle,
		details: IElementDetails,
		select: TSelectAttrs,
		data: IFieldData,
	) {
		(await this.selectMultipleOptions(handle, details, select, data)) ||
			(await this.selectSingleOption(handle, select, data));
	}

	async selectSingleOption(
		handle: ElementHandle,
		select: TSelectAttrs,
		data: IFieldData,
	) {
		const index = data.index;
		const options = Array.from(select.selectedOptions);
		const option = index && index >= 0 ? options[index]?.text : data.text;
		if (option) {
			await handle.select(option);
		}
	}

	async selectMultipleOptions(
		handle: ElementHandle,
		details: IElementDetails,
		select: TSelectAttrs,
		data: IFieldData,
	) {
		if (!select.multiple) {
			return;
		}
		const options = data.select || data.text.split(",");
		for (const option of options) {
			await this.selectOptionFor(handle, details, option);
		}
		return true;
	}

	async selectOptionFor(
		handle: ElementHandle,
		details: IElementDetails,
		option: string,
	) {
		const name = details.name;
		this.prevInput = handle;
		await handle.select(option);
		this.log(`${this.taskPrefix}Selecting opt in ${name}`);
		this.addToMessage(
			`Selected "${option}" option for select element "${name}"\n`,
		);
	}

	async typeTextIn(
		element: ElementHandle,
		details: IElementDetails,
		data: IFieldData,
	) {
		const name = details.name;
		const text = data.text;
		this.prevInput = element;
		await element.type(data.text);
		const sanitized = text.replace("\n", " ");
		this.log(`${this.taskPrefix}Typing "${sanitized}" to ${name}`);
		this.addToMessage(`Typed "${text}" to input field "${name}"\n`);
	}

	elementClassIdSelector(id: string) {
		return this.markerClass(id);
	}

	setElement(element: ElementHandle<Element>) {
		this.element = element;
	}

	findFieldForLabel(labelElem: Element) {
		const forField = labelElem.getAttribute("for");
		if (!forField) {
			return;
		}
		return this.findHandleForFieldNamed(forField);
	}

	getFormData() {
		return this.fnArgs.form_data;
	}

	async getElementById(id: string) {
		const selector = this.elementClassIdSelector(id);
		return await this.selectElement(selector);
	}

	getElementDetails(element: Element): IElementDetails {
		const name = this.getElementName(element);
		const type = this.getElementType(element);
		const tagName = this.getElementTagName(element);
		return {
			name,
			type,
			tagName,
		};
	}

	async getFieldHandleByPlaceholder(data: IFieldData) {
		const { label } = data;
		if (!label) {
			return;
		}
		return await this.findTextFieldWithPlaceholder("input, textarea", label);
	}

	async getFieldHandleByLabel(data: IFieldData) {
		const { label } = data;
		if (!label) {
			return;
		}
		const labelElement = await this.findElementWithText("label", label);
		return labelElement && (await this.findFieldForLabel(labelElement));
	}

	async getFieldHandleById(data: IFieldData) {
		const { pp_id: id } = data;
		if (!id) {
			return;
		}
		return await this.getElementById(id);
	}

	async getFieldHandle(data: IFieldData) {
		const { pp_id: id, label, name } = data;
		const handle =
			(await this.getFieldHandleById(data)) ||
			(await this.getFieldHandleByLabel(data));
		if (!handle) {
			throw new Error(
				`No such element on page: ${[id, label, name].join(",")}`,
			);
		}
		return handle;
	}

	public async execute() {
		this.formData = this.getFormData();

		// data can have: pp_id, text, label, name, options, index
		for (const data of this.formData) {
			this.resetMessage();
			try {
				const handle = await this.getFieldHandle(data);
				this.setElement(handle);
				if (!this.prevInput) {
					this.prevInput = handle;
				}

				const element = await this.handleToElement(handle);
				const elemDetails = await this.getElementDetails(element);
				// ChatGPT sometimes tries to type empty string
				// to buttons to click them
				this.onSubmittable(elemDetails) ||
					(await this.onFormField(handle, element, elemDetails, data));
			} catch (error) {
				this.log(error);
				this.addToMessage(
					`Error typing "${data.text}" to input field ID ${data.pp_id}\n`,
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
		const form = await this.prevInput?.evaluateHandle((input: any) =>
			input.closest("form"),
		);
		if (!form) {
			return;
		}
		await form.evaluate((form: any) => form.submit());
		await this.waitForNavigation();
	}

	onSubmitFormError(error: any) {
		this.log(error);
		this.log(`${this.taskPrefix}Error submitting form`);
		this.addToMessage("There was an error submitting the form.\n");
	}
}
