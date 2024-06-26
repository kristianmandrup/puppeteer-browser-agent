import type { IAgentDriver } from "../../agent";
import type { DebugOpts } from "../../types";
import { OpenAIMessageRedactor } from "./message-redactor";

export interface IAIController {
	getResponse(messages: any[], definitions: any[], fnCall: any): Promise<any>;
}

export class OpenAIController {
	definitions: any[] = [];
	debug: boolean;
	model = "gpt-3.5";
	redacter: OpenAIMessageRedactor;
	opts: DebugOpts = {};

	get openaiApiKey() {
		return process.env.OPENAPI_KEY;
	}

	constructor(
		driver: IAgentDriver,
		definitions: any[] = [],
		opts: DebugOpts = {},
	) {
		this.model = driver.model;
		this.definitions = definitions;
		this.debug = Boolean(opts.debug);
		this.opts = opts;
		this.redacter = new OpenAIMessageRedactor(driver, this.opts);
	}

	get apiEndpoint() {
		return "https://api.openai.com/v1/chat/completions";
	}

	redactMessages(messages: any[]) {
		this.redacter.redactMessages(messages);
	}

	public async getResponse(
		messages: any[],
		definitions: any[],
		fnCall = "auto",
	) {
		const response = await fetch(this.apiEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${this.openaiApiKey}`,
			},
			body: JSON.stringify({
				model: this.model,
				messages: this.redactMessages(messages),
				functions: definitions,
				// biome-ignore lint/style/useNamingConvention: <explanation>
				function_call: fnCall ?? "auto",
			}),
		}).catch((e) => {
			this.print(e);
		});
		if (!response) {
			throw new Error(`No response from OpenAPI: ${this.apiEndpoint}`);
		}
		return await response?.json();
	}

	print(data: any) {
		console.info(data);
	}
}
