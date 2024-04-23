export const sectionOutline = {
	name: "section_outline",
	description: "creates an outline of the main sections of the page",
	parameters: {
		type: "object",
		properties: {
			maxSectionTextSize: {
				type: "number",
				description:
					"max number of characters to include for a section of text",
				default: 200,
			},
		},
	},
	required: [],
};
