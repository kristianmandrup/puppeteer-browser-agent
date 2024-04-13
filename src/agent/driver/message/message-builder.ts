import type { StructuredMsg } from "..";

export class MessageBuilder {
	content = "";
	url = "";

	get message(): StructuredMsg {
		return {
			content: this.content,
			url: this.url,
		};
	}

	setContent(content = "") {
		this.content = content;
	}

	addContent(content: string) {
		this.content += content;
	}

	setUrl(url: string) {
		this.url = url;
	}
}
