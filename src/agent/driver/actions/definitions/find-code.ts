export const findCode = {
	name: "find_code",
	description:
		"Finds code blocks within headers containing optional descriptive text for the code",
	parameters: {
		type: "object",
		properties: {
			lineSelector: {
				type: "string",
				description:
					"selector to use within a code tag to identify each line of code",
			},
			codeTitle: {
				type: "string",
				description: "the section header title for the code to be extracted",
			},
		},
	},
	required: [],
};
