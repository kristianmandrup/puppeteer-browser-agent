import type { StructuredMsg } from "../agent-driver";

export interface IMessageBuilder {
	message: StructuredMsg;
	setContent(content?: string): void;
	addContent(content: string): void;
	setUrl(url: string): void;
}
export class MessageBuilder implements IMessageBuilder {
	content = "";
	url = "";

	get message(): StructuredMsg {
		return {
			content: this.content,
			url: this.url,
		};
	}

	public setContent(content = "") {
		this.content = content;
	}

	public addContent(content: string) {
		this.content += content;
	}

	public setUrl(url: string) {
		this.url = url;
	}
}
