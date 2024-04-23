export const takeScreenshot = {
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
};
