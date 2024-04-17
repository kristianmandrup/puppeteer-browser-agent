import { BaseDriverAction, type IDriverAction } from "./base-action";

export abstract class ElementAction
	extends BaseDriverAction
	implements IDriverAction
{
	protected async getTabbableElements() {
		if (!this.page) {
			throw new Error("Missing page");
		}
		return await this.elementSelector?.getElements(this.page);
	}

	protected get elementSelector() {
		return this.driver.elementSelector;
	}
}
