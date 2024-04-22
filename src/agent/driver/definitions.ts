export const actionDefinitions = [
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
			"Clicks a link with the given pp_id on the page. Note that pp_id is required and you must use the corresponding pgpt-id attribute from the page content. Add the text of the link to confirm that you are clicking the right link.",
		parameters: {
			type: "object",
			properties: {
				text: {
					type: "string",
					description: "The text on the link you want to click",
				},
				pp_id: {
					type: "number",
					description: "The pp-id of the link to click (from the page content)",
				},
			},
		},
		required: ["reason", "pp_id"],
	},
	{
		name: "enter_data",
		description: "Types text to input fields and optionally submit the form",
		parameters: {
			type: "object",
			properties: {
				form_data: {
					type: "array",
					items: {
						type: "object",
						properties: {
							pp_id: {
								type: "number",
								description:
									"The marker id attribute of the field to enter data into",
							},
							label: {
								type: "string",
								description: "The label of the field to enter data into",
							},
							name: {
								type: "string",
								description: "The name of the field to enter data into",
							},
							text: {
								type: "string",
								description: "The text to type",
							},
							select: {
								type: "array",
								description: "list of options to select",
								items: {
									type: "string",
									description: "option to select",
								},
							},
							index: {
								type: "number",
								description: "index number of option to select",
							},
							check: {
								type: "boolean",
								description: "whether to check or uncheck radio button",
							},
						},
					},
				},
				submit: {
					type: "boolean",
					description: "Whether to submit the form after filling the fields",
				},
			},
		},
		required: ["form_data", "submit"],
	},
	{
		name: "take_screenshot",
		description:
			"Takes a screenshot of the page or starting from a specific element.",
		parameters: {
			type: "object",
			properties: {
				parentType: {
					type: "string",
					description:
						"the type of parent the element under, including: main, footer, header, aside, dialog, nav, article, section, form",
				},
				parentId: {
					type: "string",
					description:
						"the type of element including: header, section, field, form, canvas, figure, article, video, code",
				},
				type: {
					type: "string",
					description:
						"the type of element including: header, section, field, form, canvas, figure, article, video, code",
				},
				id: {
					type: "string",
					description: "the id of the element",
				},
				selector: {
					type: "string",
					description:
						"An optional more fine-grained CSS selector for the element in addition to the parentType, type, parentId and id",
				},
				content: {
					type: "string",
					description:
						"Optional content that the element should contain to match",
				},
			},
		},
	},
	{
		name: "communicate",
		description:
			"Provide an answer with a summary of the page to the user when the given task has been completed.",
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
					description:
						"The response to the external actor such as a human user or an automated agent",
				},
			},
		},
		required: ["summary", "answer"],
	},
	{
		name: "search",
		description:
			"Uses a search engine to find links/urls that best match a specific query",
		parameters: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description: "What to query the search engine for",
				},
				searchEngine: {
					type: "string",
					description: "The search engine to use such as google, bing etc",
				},
			},
		},
		required: ["query"],
	},
];
