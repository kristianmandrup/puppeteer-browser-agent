export class OpenAIMessageBroker {
	async sendMessage(
		message,
		context,
		function_call = "auto",
		functions = null,
	) {
		let messages = [...context];
		messages.push(message);

		if (debug) {
			fs.writeFileSync("context.json", JSON.stringify(messages, null, 2));
		}

		let definitions = [
			{
				name: "make_plan",
				description:
					"Create a plan to accomplish the given task. Summarize what the user's task is in a step by step manner. How would you browse the internet to accomplish the task. Start with 'I will'",
				parameters: {
					type: "object",
					properties: {
						plan: {
							type: "string",
							description:
								"The step by step plan on how you will navigate the internet and what you will do",
						},
					},
				},
				required: ["plan"],
			},
			{
				name: "read_file",
				description:
					"Read the contents of a file that the user has provided to you",
				parameters: {
					type: "object",
					properties: {
						filename: {
							type: "string",
							description:
								"The filename to read, e.g. file.txt or path/to/file.txt",
						},
					},
				},
				required: ["filename"],
			},
			{
				name: "goto_url",
				description: "Goes to a specific URL and gets the content",
				parameters: {
					type: "object",
					properties: {
						url: {
							type: "string",
							description: "The URL to go to (including protocol)",
						},
					},
				},
				required: ["url"],
			},
			{
				name: "click_link",
				description:
					"Clicks a link with the given pgpt_id on the page. Note that pgpt_id is required and you must use the corresponding pgpt-id attribute from the page content. Add the text of the link to confirm that you are clicking the right link.",
				parameters: {
					type: "object",
					properties: {
						text: {
							type: "string",
							description: "The text on the link you want to click",
						},
						pgpt_id: {
							type: "number",
							description:
								"The pgpt-id of the link to click (from the page content)",
						},
					},
				},
				required: ["reason", "pgpt_id"],
			},
			{
				name: "type_text",
				description:
					"Types text to input fields and optionally submit the form",
				parameters: {
					type: "object",
					properties: {
						form_data: {
							type: "array",
							items: {
								type: "object",
								properties: {
									pgpt_id: {
										type: "number",
										description:
											"The pgpt-id attribute of the input to type into (from the page content)",
									},
									text: {
										type: "string",
										description: "The text to type",
									},
								},
							},
						},
						submit: {
							type: "boolean",
							description:
								"Whether to submit the form after filling the fields",
						},
					},
				},
				required: ["form_data", "submit"],
			},
			{
				name: "answer_user",
				description:
					"Give an answer to the user and end the navigation. Use when the given task has been completed. Summarize the relevant parts of the page content first and give an answer to the user based on that.",
				parameters: {
					type: "object",
					properties: {
						summary: {
							type: "string",
							description:
								"A summary of the relevant parts of the page content that you base the answer on",
						},
						answer: {
							type: "string",
							description: "The response to the user",
						},
					},
				},
				required: ["summary", "answer"],
			},
		];

		if (functions !== null) {
			definitions = definitions.filter((definition) => {
				return in_array(definition.name, functions);
			});
		}

		print(task_prefix + "Sending ChatGPT request...");
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${openaiApiKey}`,
			},
			body: JSON.stringify({
				model: model,
				messages: redact_messages(messages),
				functions: definitions,
				function_call: function_call ?? "auto",
			}),
		}).catch(function (e) {
			print(e);
		});

		const data = await response.json();

		if (data.choices === undefined) {
			print(data);
		}

		// fix JSON arguments
		if (data.choices[0].message.hasOwnProperty("function_call")) {
			data.choices[0].message.function_call.arguments =
				data.choices[0].message.function_call.arguments.replace(
					'"\n  "',
					'",\n  "',
				);
		}

		token_usage.completion_tokens += data.usage.completion_tokens;
		token_usage.prompt_tokens += data.usage.prompt_tokens;
		token_usage.total_tokens += data.usage.total_tokens;

		let cost = token_cost(
			data.usage.prompt_tokens,
			data.usage.completion_tokens,
			model,
		);

		if (cost > 0.09) {
			print(
				"Cost: +" +
					round(cost, 2) +
					" USD (+" +
					data.usage.total_tokens +
					" tokens)",
			);
		}

		if (autopilot) {
			print(
				"<!_TOKENS_!>" +
					data.usage.prompt_tokens +
					" " +
					data.usage.completion_tokens +
					" " +
					data.usage.total_tokens,
			);
		}

		return data.choices[0].message;
	}
}
