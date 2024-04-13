export class OpenAIMessageRedacter {
	redact(messages) {
		let redacted_messages = [];
		let current_url = messages[messages.length - 1].url;

		messages.forEach((message) => {
			let msg = JSON.parse(JSON.stringify(message));

			if (msg.url != current_url) {
				//msg.content = msg.redacted ?? msg.content ?? "";
			}

			delete msg.redacted;
			delete msg.url;

			redacted_messages.push(msg);
		});

		if (debug) {
			fs.writeFileSync(
				"context_redacted" + redacted_messages.length + ".json",
				JSON.stringify(redacted_messages, null, 2),
			);
		}

		return redacted_messages;
	}
}
