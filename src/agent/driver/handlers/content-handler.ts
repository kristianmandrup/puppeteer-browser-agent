import { BaseResponseHandler, type IBaseResponseHandler } from "./base-handler";

export interface IContentResponseHandler extends IBaseResponseHandler {}

export class ContentResponseHandler extends BaseResponseHandler {
	actionId?: string;

	public async handle(step: any) {
		super.handle(step);
		if (this.isFunctionCallStep()) {
			return;
		}
		this.printCurrentCost();
		let nextContent = this.step.content.trim();

		if (nextContent === "") {
			nextContent = "<empty response>";
		}
		await this.setAiMessage(nextContent);
	}

	setAiMessage(content: string) {
		this.driver.setAiMessage(content);
	}

	printCurrentCost() {
		this.driver.printCurrentCost();
	}
}
