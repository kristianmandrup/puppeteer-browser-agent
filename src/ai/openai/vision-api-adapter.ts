import OpenAI from "openai";

export interface InputData {
	prompt: string;
	imageData: string;
}

export interface SimpleGPTVisionOptions {
	apiKey: string;
}

export class SimpleGPTVision {
	private openai: OpenAI;

	constructor(options: SimpleGPTVisionOptions) {
		this.openai = new OpenAI({
			apiKey: options.apiKey || "",
		});
	}

	async processInput(input: InputData): Promise<string> {
		try {
			let { prompt, imageData } = input;
			if (!imageData.startsWith("http")) {
				imageData = `data:image/png;base64,${imageData}`;
			}

			const messages: OpenAI.ChatCompletionMessageParam[] = [
				{
					role: "system",
					content: "lang:en", // Set language to English
				},
				{
					role: "user",
					content: [
						{
							type: "text",
							text: prompt,
						},
						{
							type: "image_url",
							image_url: {
								url: imageData,
							},
						},
					],
				},
			];

			const resp: OpenAI.Chat.Completions.ChatCompletion =
				await this.openai.chat.completions.create({
					model: "gpt-4-vision-preview",
					max_tokens: 1024,
					messages,
				});
			if (!resp) {
				throw new Error("No response from OpenAI");
			}
			const firstChoice = resp.choices[0];
			if (!firstChoice) {
				throw new Error("No content in response from OpenAI");
			}
			return `${firstChoice.message.content}`;
		} catch (error: any) {
			if (error.response) {
				throw new Error(
					`${error.response.status}, ${JSON.stringify(
						error.response.data.error.message,
					)}`,
				);
			}
			throw new Error(`${error.type}, ${error.message}`);
		}
	}
}

export default SimpleGPTVision;
