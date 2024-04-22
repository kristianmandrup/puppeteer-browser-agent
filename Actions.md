# Actions

This guide describes how to use and leverage the built-in actions

- [Read file](#read-file)
- [Enter data](#enter-data)
- [Click link](#click-link)
- [Goto URL](#goto-url)
- [Communicate](#communicate)

## Read file

The core logic of the `execute` method for the `ReadFileAction` is the following

```ts
this.prepareReadFile();
await this.attemptToReadFile();
this.handleCannotReadFile();
```

### Read file action definitions

The `read_file` definition is an object with the following properties

- `filename` the location of the file to read

```ts
{
	name: "read_file",
	description:
		"Read the contents of a file in a given location on disk",
	parameters: {
		type: "object",
		properties: {
			filename: {
				type: "string",
				description:
					"The filename to read, e.g. file.txt or path/to/file.txt",
			},
		},
	},
	required: ["filename"],
},
```

## Enter data

The `EnterDataAction` class can be used as a building block for actions that enter data into form fields on pages.

### Enter Data Action Definition

The following is the definition for the `type_text` action mapped to the `EnterDataAction` class.
It outlines an object with a `form_data` property that much be an array, where each item specifies the details on how to find a form field and how to enter data for that form field.

A form field can be identified by either:

- the special id (`pp_id`)
- the `label` for the field to be matched with a `label` element or `placeholder` for the field
- `name` of the field.

Note that the `pp_id` will be added to elements previously collected from screen scraping the page, via `getTabbableElements` and setting `interactiveElements`.

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

## Click link

This action clicks a given link on the page

### Click link action definition

The `click_link` definition is an object with the following properties

- `text` the text of the link to click
- `pp_id` the special id of the link to click

The `pp_id` will be added to elements previously collected from screen scraping the page, via `getTabbableElements` and setting `interactiveElements`.

```ts
	{
		name: "click_link",
		description:
			"Clicks a link with the given pp_id on the page. Note that pp_id is required and you must use the corresponding pp-id attribute from the page content. Add the text of the link to confirm that you are clicking the right link.",
		parameters: {
			type: "object",
			properties: {
				text: {
					type: "string",
					description: "The text on the link you want to click",
				},
				pp_id: {
					type: "number",
					description:
						"The pp-id of the link to click (from the page content)",
				},
			},
		},
		required: ["text", "pp_id"],
	},
```

## Goto URL

This action navigates to the given url and collects elements of interest using screen scraping.

The core of the `execute` method is as follows

```ts
try {
  await this.gotoUrl(url);
  url = await this.getUrl(url);
  this.setMessage(`You are now on ${url}`);
} catch (error) {
  const errMessage = this.downloadError(error) || this.defaultGotoErrorMessage;
  this.setMessage(errMessage);
}
this.onStartScraping();
this.interactiveElements = await this.getTabbableElements();
```

### Goto url action definition

The `goto_url` definition is an object with the following properties

- `url` the url for where to navigate to

Note: Ideally there should be a `find_urls` action, which uses a search engine (or similar) to find the most suitable URLs to nagiate to, in order to complete a given task.

```ts
{
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
},
```

## Search

This action searches for search results using a search engine
The core of the `execute` method is as follows

```ts
this.onStart();
await this.gotoUrl(this.queryUrl);
this.onStartScraping();
this.searchResults = await this.getSearchResults();
```

The results of this action can be fed to the AI or external agent and be used to decide which URL to goto using the `Goto URL` action

### Search action definition

The `search` definition is an object with the following properties

- `searchEngine` name of a registered search engine to use for the search
- `query` what to query for in the search engine

```ts
{
	name: "search",
	description: "Search for search results using a search engine",
	parameters: {
		type: "object",
		properties: {
			query: {
				type: "string",
				description: "What to query the search engine for",
			},
			searchEngine: {
				type: "string",
				description: "Name of the search engine to use",
			},
		},
	},
	required: ["query"],
},
```

## Take screenshot

### Take screenshot action definition

The `take_screenshot` definition is an object with the following properties

- `parentType` the high-level type of the main parent element the element should be under such as main, footer, aside etc.
- `parentId` an optional id of the main parent element
- `type` of the element such as header, section or field
- `id` optional id of the element
- `selector` optional sub-selector to more precisely define the element to search for
- `content` optional text content that the element should contain

```ts
{
	name: "take_screenshot",
	description:
		"Takes a screenshot of the page or starting from a specific element.",
	parameters: {
		type: "object",
		properties: {
			filepath: {
				type: "string",
				description: "The filepath for where to store the screenshot"
			},
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
},
```

## Communicate

The `CommunicateAction` is used to answer an external agent (such as a user) with results from the navigation and receive input in response to the answer to drive further actions by the browser agent.

```ts
public async execute() {
	this.prepareAnswer();
	await this.receiveInput(this.promptAnswer);
}

protected get promptAnswer() {
	return this.autopilot ? this.autoPilotMsg : this.userMsg;
}
```

In case `autopilot` is not on, the expectation is that a user will receive the answer and reply back with more instructions as per the following `userMsg` used by `promptAnswer`

```ts
protected get userMsg() {
	return `\nAI agent: ${this.text}\nYou: `;
}
```

When `autopilot` is turned on, the answer will be structured as JSON and will thus be stringified

```ts
protected get autoPilotMsg() {
	return `<!_RESPONSE_!>${JSON.stringify(this.text)}\n`;
}
```

### Communicate action definition

The `communicate` definition is an object with the following properties

- `summary` of relevants part of the page that answer is based on
- `answer` response to the user

```ts
	{
		name: "communicate",
		description:
			"Give an answer to the user and end the navigation. Use when the given task has been completed. Summarize the relevant parts of the page content first and give an answer to the user based on that.",
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
					description: "The response to the user",
				},
			},
		},
		required: ["summary", "answer"],
	},
```
