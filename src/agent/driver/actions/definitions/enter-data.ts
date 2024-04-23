export const enterData = {
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
};
