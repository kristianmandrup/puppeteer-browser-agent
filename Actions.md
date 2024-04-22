# Actions

This guide describes how to use and leverage the built-in actions

- Enter data

## Enter data

The `EnterDataAction` class can be used as a building block for actions that enter data into form fields on pages.

### Enter Data Action Definition

The following is the definition for the `type_text` action mapped to the `EnterDataAction` class.
It outlines an object with a `form_data` property that much be an array, where each item specifies the details on how to find a form field and how to enter data for that form field.

A form field can be identified (found) by either a special id (`pp_id`), the label (or placeholder) for the field or by name of the field.

The data entered can be either:

- a specific text (typical for text inputs and text areas)
- `select` or `index` for selectors (ie. drop-downs), where select is an array of options to select and `index` a specific index number for a given option
- `check` is for radio buttons and specifies if the radio should be checked (`true`) or unchecked (`false`)

The AI agent should be given these instructions so it knows how to instruct the action on how to fill in fields on a given page accordingly.

```ts
{
	name: "type_text",
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
```
