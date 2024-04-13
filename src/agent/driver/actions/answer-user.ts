import { BaseDriverAction } from "./base-action";

export class GotoUrlAction extends BaseDriverAction {
	async execute() {
		let text = this.fnArgs.answer;

		if (!text) {
			text = this.fnArgs.summary;
		}

		this.printCurrentCost();

		if (this.autopilot) {
			await this.receiveInput(this.autoPilotMsg);
		} else {
			await this.receiveInput(this.userMsg);
		}
	}

	get text() {
		return "??";
	}

	get userMsg() {
		const text = this.text;
		return `\nGPT: ${text}\nYou: `;
	}

	get autoPilotMsg() {
		const text = this.text;
		return `<!_RESPONSE_!>${JSON.stringify(text)}\n`;
	}

	async receiveInput(msg: string) {
		await this.getInput(msg);
	}

	printCurrentCost() {
		// TODO: use cost calculator
	}
}
