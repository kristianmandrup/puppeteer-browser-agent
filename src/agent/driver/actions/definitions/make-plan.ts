export const makePlan = {
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
};
