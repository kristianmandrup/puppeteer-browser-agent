import type { DebugOpts } from "../../types";

export class OpenAITokenCostCalculator {
	tokenUsage = {
		promptTokens: 0,
		completionTokens: 0,
		totalTokens: 0,
	};

	model?: string;
	debug = false;

	constructor(model: string, opts: DebugOpts = {}) {
		this.model = model;
		this.debug = Boolean(opts.debug);
	}

	getTokenPrice(model: string, direction: string) {
		let tokenPriceInput = 0.0;
		let tokenPriceOutput = 0.0;

		if (model.indexOf("gpt-4-32k") === 0) {
			tokenPriceInput = 0.06 / 1000;
			tokenPriceOutput = 0.12 / 1000;
		} else if (model.indexOf("gpt-4") === 0) {
			tokenPriceInput = 0.03 / 1000;
			tokenPriceOutput = 0.06 / 1000;
		} else if (model.indexOf("gpt-3.5-turbo-16k") === 0) {
			tokenPriceInput = 0.003 / 1000;
			tokenPriceOutput = 0.004 / 1000;
		} else if (model.indexOf("gpt-3.5-turbo") === 0) {
			tokenPriceInput = 0.0015 / 1000;
			tokenPriceOutput = 0.002 / 1000;
		}

		if (direction === "input") {
			return tokenPriceInput;
		}
		return tokenPriceOutput;
	}

	tokenCost(promptTokens: number, completionTokens: number) {
		const { model } = this;
		if (!model) {
			throw new Error("Invalid or missing model");
		}
		const promptPrice = this.getTokenPrice(model, "input");
		const completionPrice = this.getTokenPrice(model, "output");

		return promptTokens * promptPrice + completionTokens * completionPrice;
	}

	round(num: number, decimals = 2) {
		return num.toFixed(decimals);
	}

	printCurrentCost() {
		const { tokenUsage, model } = this;
		const cost = this.tokenCost(
			tokenUsage.promptTokens,
			tokenUsage.completionTokens,
		);

		this.print(
			`Current cost: ${this.round(cost, 2)} USD (${
				tokenUsage.totalTokens
			} tokens)`,
		);
	}

	print(message = "") {
		console.log(message);
	}
}
