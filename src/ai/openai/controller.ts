import type { DebugOpts } from "../../types";
import { OpenAIMessageRedacter } from "./message-redacter";

export class OpenAIController {
	definitions: any[] = [];
	debug: boolean;
	model = "gpt-3.5";
	redacter: OpenAIMessageRedacter;
	opts: DebugOpts = {};

	get openaiApiKey() {
		return process.env.OPENAPI_KEY;
	}

	constructor(model: string, definitions: any[] = [], opts: DebugOpts = {}) {
		this.model = model;
		this.definitions = definitions;
		this.debug = Boolean(opts.debug);
		this.opts = opts;
		this.redacter = new OpenAIMessageRedacter(this.opts);
	}

	get apiEndpoint() {
		return "https://api.openai.com/v1/chat/completions";
	}

	redactMessages(messages: any[]) {
		this.redacter.redactMessages(messages);
	}

	async getResponse(messages: any[], definitions: any[], fnCall = "auto") {
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
