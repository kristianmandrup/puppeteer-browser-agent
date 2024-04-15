import fs from "node:fs";
import type { DebugOpts } from "../../types";
export class OpenAIMessageRedacter {
	currentUrl = "";
	debug: boolean;

	constructor(opts: DebugOpts) {
		this.debug = Boolean(opts.debug);
	}

	redactMessages(messages: any[]) {
		this.currentUrl = messages[messages.length - 1].url;

		const redactMessage = this.redactMessage.bind(this);
		return messages.map(redactMessage);
	}

	redactMessage(message: any) {
		const msg = JSON.parse(JSON.stringify(message));
		if (msg.url !== this.currentUrl) {
			// msg.content = msg.redacted ?? msg.content ?? "";
		}
		msg.redacted = undefined;
		msg.url = undefined;
		return msg;
	}

	logRedacted(redactedMessages: any[]) {
		if (!this.debug) {
			return;
		}
		fs.writeFileSync(
			`context_redacted${redactedMessages.length}.json`,
			JSON.stringify(redactedMessages, null, 2),
		);
	}
}
