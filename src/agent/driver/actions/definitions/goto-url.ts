export const gotoUrl = {
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
};
