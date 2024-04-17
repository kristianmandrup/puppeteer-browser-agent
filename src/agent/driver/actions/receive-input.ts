import {
	type ITokenCostCalculator,
	OpenAITokenCostCalculator,
} from "../../../ai/openai/token-cost-calculator";
import { BaseDriverAction, type IDriverAction } from "./base-action";

export interface IReceiveInputAction extends IDriverAction {
	receiveInput(msg: string): Promise<string>;
}

export class ReceiveInputAction
	extends BaseDriverAction
	implements IReceiveInputAction
{
	costCalculator?: ITokenCostCalculator;
	text?: string;

	protected initialize(): void {
		this.costCalculator = this.createCostCalculator();
	}

	protected createCostCalculator() {
		return new OpenAITokenCostCalculator(this.driver, this.opts);
	}

	public async execute() {
		this.setText(this.textFromFnArgs());

		this.printCurrentCost();

		if (this.autopilot) {
			await this.receiveInput(this.autoPilotMsg);
		} else {
			await this.receiveInput(this.userMsg);
		}
	}

	protected setText(text?: string) {
		this.text = text;
	}

	protected textFromFnArgs() {
		return this.fnArgs.answer || this.fnArgs.summary;
	}

	protected get userMsg() {
		return `\nGPT: ${this.text}\nYou: `;
	}

	protected get autoPilotMsg() {
		return `<!_RESPONSE_!>${JSON.stringify(this.text)}\n`;
	}

	public async receiveInput(msg: string) {
		return await this.getInput(msg);
	}

	protected printCurrentCost() {
		this.costCalculator?.printCurrentCost();
	}
}
