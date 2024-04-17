import type { DebugOpts } from "../../../types";
import fs from "node:fs";
import {
	type IOpenAITokenCostCalculator as IAITokenCostCalculator,
	OpenAITokenCostCalculator,
} from "../../../ai/openai/token-cost-calculator";
import type { ActionConfig } from "../../agent-planner";
import {
	type IAIController,
	OpenAIController,
} from "../../../ai/openai/controller";
import type { IAgentDriver } from "../agent-driver";

type AiResponseData = {
	choices: any[];
	usage: TokenUsage;
};

type TokenUsage = {
	completionTokens: number;
	promptTokens: number;
	totalTokens: number;
};

export type ResponseData = {
	usage: TokenUsage;
};

// biome-ignore lint/style/useNamingConvention: <explanation>
export interface IMessageSender {
	sendMessageToController(
		message: unknown,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		context: any,
		actionConfig: ActionConfig,
	): Promise<unknown>;
}

export type MessageSenderOpts = DebugOpts;

export class MessageSender implements IMessageSender {
	debug: boolean;
	messages: unknown[] = [];
	tokenUsage: TokenUsage = {
		completionTokens: 0,
		promptTokens: 0,
		totalTokens: 0,
	};
	taskPrefix = "";
	autopilot = true;
	opts: DebugOpts = {};
	model = "gpt-3.5";
	calculator?: IAITokenCostCalculator;
	actions: any[] = [];
	controller?: IAIController;
	driver: IAgentDriver;

	constructor(driver: IAgentDriver, opts: MessageSenderOpts = {}) {
		this.debug = Boolean(opts.debug);
		this.opts = opts;
		this.driver = driver;
		this.model = driver.model || this.model;
		this.calculator = this.createTokenCostCalculator();
		this.controller = this.createController();
	}

	get definitions() {
		return this.driver.definitions;
	}

	public async sendMessageToController(
		message: unknown,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		context: any,
		actionConfig: ActionConfig,
	) {
		const messages = [...context];
		messages.push(message);

		this.logMessageContext(messages);

		const filteredDefinitions = this.filterDefinitions(
			this.actions,
			this.definitions,
		);

		// TODO: ??
		const data = await this.getAiResponseData(
			actionConfig,
			filteredDefinitions,
		);

		this.onAutoPilotActivated(data);
		return this.getMessageFromAiData(data);
	}

	get costLimits() {
		return {
			min: 0.09,
		};
	}

	protected createController() {
		return new OpenAIController(this.driver, this.definitions, this.opts);
	}

	protected createTokenCostCalculator() {
		return new OpenAITokenCostCalculator(this.driver, this.opts);
	}

	protected logMessageContext(messages: unknown) {
		if (this.debug) {
			fs.writeFileSync("context.json", JSON.stringify(messages, null, 2));
		}
	}

	protected filterDefinitions(actions: string[] = [], definitions: any[] = []) {
		if (!actions) {
			return [];
		}
		return definitions.filter((definition) =>
			actions.includes(definition.name),
		);
	}

	protected async getAiResponseData(
		actionConfig: ActionConfig,
		filteredDefinitions: any[],
	) {
		this.print(`${this.taskPrefix}Sending ChatGPT request...`);
		const action = actionConfig.action;
		return await this.controller?.getResponse(
			this.messages,
			filteredDefinitions,
			action,
		);
	}

	protected getController() {
		this.controller;
	}

	protected print(data: any) {
		console.info(data);
	}

	protected handleInvalidData(data: any) {
		if (data.choices === undefined) {
			this.print(data);
		}
	}

	protected formatResponseData(data: any) {
		this.handleInvalidData(data);
		// fix JSON arguments
		if (data.choices[0].message.fnCall) {
			data.choices[0].message.fnCall.arguments =
				data.choices[0].message.fnCall.arguments.replace('"\n  "', '",\n  "');
		}
	}

	protected calculateTokenCost(data: any) {
		this.tokenUsage.completionTokens += data.usage.completion_tokens;
		this.tokenUsage.promptTokens += data.usage.prompt_tokens;
		this.tokenUsage.totalTokens += data.usage.total_tokens;

		// TODO

		return this.tokenCost(data.usage.promptTokens, data.usage.completionTokens);
	}

	protected tokenCost(promptTokens: number, completionTokens: number) {
		return this.calculator?.tokenCost(promptTokens, completionTokens);
	}

	protected handleCost(cost: number, data: any) {
		if (cost <= this.costLimits.min) {
			return;
		}
		this.print(
			`Cost: +${this.round(cost, 2)} USD (+${data.usage.total_tokens} tokens)`,
		);
	}

	protected round(cost: number, decimals = 2) {
		return cost.toFixed(decimals);
	}

	protected getMessageFromAiData(data: AiResponseData) {
		return data.choices[0].message;
	}

	protected onAutoPilotActivated(data: AiResponseData) {
		if (!this.autopilot) {
			return;
		}
		this.print(
			`<!_TOKENS_!>${data.usage.promptTokens} ${data.usage.completionTokens} ${data.usage.totalTokens}`,
		);
	}
}
