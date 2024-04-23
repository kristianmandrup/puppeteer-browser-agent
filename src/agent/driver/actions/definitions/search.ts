export const search = {
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
};
