export const communicate = {
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
};
