import {
	type ITokenCostCalculator,
	OpenAITokenCostCalculator,
} from "../../../ai/openai/token-cost-calculator";
import { BaseDriverAction, type IDriverAction } from "./base-action";

export interface IReceiveInputAction extends IDriverAction {
	receiveInput(msg: string): Promise<string>;
}

export class CommunicateAction
	extends BaseDriverAction
	implements IReceiveInputAction
{
	costCalculator?: ITokenCostCalculator;
	text?: string;
	name = "communicate";

	protected initialize(): void {
		this.costCalculator = this.createCostCalculator();
	}

	protected createCostCalculator() {
		return new OpenAITokenCostCalculator(this.driver, this.opts);
	}

	public async execute() {
		this.prepareAnswer();
		await this.receiveInput(this.promptAnswer);
	}

	protected prepareAnswer() {
		this.setText(this.textFromFnArgs());
		this.printCurrentCost();
	}

	protected get promptAnswer() {
		return this.autopilot ? this.autoPilotMsg : this.userMsg;
	}

	protected setText(text?: string) {
		this.text = text;
	}

	protected textFromFnArgs() {
		return this.fnArgs.answer || this.fnArgs.summary;
	}

	protected get userMsg() {
		return `\nAI agent: ${this.text}\nYou: `;
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
