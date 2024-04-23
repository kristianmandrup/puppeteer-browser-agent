export const clickLink = {
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
};
