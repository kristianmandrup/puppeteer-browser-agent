# Puppeteer Browser Agent

## Status

WIP - based on work by unconvcode/GPT-puppeteer

## Installation

```
npm i puppeteer-browser-agent
```

## Design

The implementation is in Typescript and is best used in this environment.

First write an implementation of `IAgentPlanner` or extend the built-in `AgentPlanner` class.
This class needs to have at least an async `runPlan` method which runs the overall agent plan.

The `AgentPlanner` can use the `AgentDriver` to implement an agent driving the browser via puppeteer.

The `AgentDriver` must implement `IAgentDriver` by supplying the async methods `start` and `run`.

The `start` method should start the browser and do any initialization necessary.
The `run` method should implement the core logic which takes actions and performs them via the browser.

The driver can register actions via the method `registerAction(label: string, action: IDriverAction)` and remove actions via `removeAction(label: string)`.

## Actions

The library comes with a set of basic actions that can be used as starting point, to be extended or used as you find suitable. Each of these actions extends `DriverAction` and implements the `IDriverAction` interface which simply requires an async `execute` method.

These actions are:

- `GotoUrlAction` implementing `IGotoUrlAction` to goto a given URL page
- `ClickLinkAction` implementing `IClickLinkAction` to click page links
- `ReadFileAction` implementing `IReadFileAction` to read a file for instructions
- `ReceiveInputAction` implementing `IReceiveInputAction` for user/agent input to instruct driver for decisions and actions
- `SubmitFormAction` implementing `ISubmitFormAction` to enter data into form fields and submit forms

These actions have been ported directly from GPT-puppeteer for now, but can be refined further as needed. Some actions may currently be incomplete but should include the required infrastructure.

## Action definitions

```ts
const makePlan = {
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

const readFile = {
  name: "read_file",
  description: "Read the contents of a file that the user has provided to you",
  parameters: {
    type: "object",
    properties: {
      filename: {
        type: "string",
        description: "The filename to read, e.g. file.txt or path/to/file.txt",
      },
    },
  },
  required: ["filename"],
};

export const definitions = [
  makePlan,
  readFile,
  // more actions ...
];
```

## Custom implementation example

A custom implementation would look like the following snippet, where factory methods in each custom class can be used to wire the implementation as needed.

```ts
export class MyAgentPlanner extends AgentPlanner {
  // override as necessary

  protected createDriver() {
    this.driver = new MyAgentDriver(this, this.opts);
  }

  protected createMessageSender() {
    return new MyMessageSender(this.driver);
  }
}

export class MyMessageSender extends MessageSender {
  // override as necessary

  protected createController() {
    return new MyAIController(this.driver, definitions, this.opts);
  }

  protected createTokenCostCalculator() {
    return new MyAITokenCostCalculator(this.driver, this.opts);
  }
}

export class MyAgentDriver extends AgentDriver {
  // override as necessary

  protected createInputController() {
    // pass a createInputReader factory function
    return new MyTerminalInputController(createInputReader);
  }

  protected createMessageBuilder() {
    return new MyMessageBuilder(this);
  }

  protected createPageScaper() {
    return new MyPageScaper(this);
  }

  protected createElementSelector() {
    return new MyElementSelector(this);
  }

  protected createAgentBrowser() {
    return new MyAgentBrowser(this);
  }
}

export class MyAgentBrowser extends AgentBrowser {
  // override as necessary
}

export class MyElementSelector extends ElementSelector {
  // override as necessary
  protected createPageNavigator() {
    return new MyPageNavigator(this.driver);
  }
}

export class MyPageNavigator extends DocumentNavigator {
  // override as necessary

  protected createElementEvaluator(
    element: Element,
    id: number,
    selector: string
  ) {
    return new MyElementEvaluator(this.driver, element, id, selector);
  }
}

export class MyPageScraper extends PageScraper {
  // override as necessary

  protected createDocumentTraverser() {
    return new DocumentTraverser(this.driver, this.opts);
  }
}

export class MyDocumentTraverser extends DocumentTraverser {
  // override as necessary

  protected createFormatter() {
    return new HtmlFormatter(this.driver);
  }

  protected createElementTypeHandler() {
    return new ElementTypeHandler(this.driver, this);
  }
}

export class MyHtmlFormatter extends HtmlFormatter {
  // override as necessary
}

export class MyElementTypeHandler extends ElementTypeHandler {
  // override as necessary

  protected createTagBuilder() {
    return new TagBuilder(this.driver);
  }
}

export class MyElementSelector extends ElementSelector {
  // override as necessary

  protected createInteractiveElementHandler() {
    return new InteractiveElementHandler(this.driver);
  }
}

export class MyMessageBuilder extends MessageBuilder {
  // override as necessary
}

// And so on...

const context = {
  role: "system",
  content: `## OBJECTIVE ##
You have been tasked with crawling the internet based on a task given by the user. You are connected to a web browser which you can control via function calls to navigate to pages and list elements on the page. You can also type into search boxes and other input fields and send forms. You can also click links on the page. You will behave as a human browsing the web.

You will try to navigate directly to the most relevant web address. If you were given a URL, go to it directly. If you encounter a Page Not Found error, try another URL. If multiple URLs don't work, you are probably using an outdated version of the URL scheme of that website. In that case, try navigating to their front page and using their search bar or try navigating to the right place with links.
`,
};

const planner = new MyAgentPlanner(context, {
  debug: true,
});

await planner.runPlan();

// create actions and register them with the driver
const myGotoUrlAction = new MyGotoUrlAction();
// ...

planner.driver.registerAction("goto_url", myGotoUrlAction);
// register more actions as needed

// set action definitions
planner.driver.setDefinitions(definitions);
```

## Contribute

![NPM](https://img.shields.io/npm/l/@gjuchault/typescript-library-starter)
![NPM](https://img.shields.io/npm/v/@gjuchault/typescript-library-starter)
![GitHub Workflow Status](https://github.com/gjuchault/typescript-library-starter/actions/workflows/typescript-library-starter.yml/badge.svg?branch=main)

Yet another (opinionated) TypeScript library starter template.

If you're looking for a backend service starter, check out my [typescript-service-starter](https://github.com/gjuchault/typescript-service-starter)

## Opinions and limitations

1. Relies as much as possible on each included library's defaults
2. Only relies on GitHub Actions
3. Does not include documentation generation

## Getting started

1. `npx degit gjuchault/typescript-library-starter my-project` or click on the `Use this template` button on GitHub!
2. `cd my-project`
3. `npm install`
4. `git init` (if you used degit)
5. `npm run setup`

To enable deployment, you will need to:

1. Set up the `NPM_TOKEN` secret in GitHub Actions ([Settings > Secrets > Actions](https://github.com/gjuchault/typescript-library-starter/settings/secrets/actions))
2. Give `GITHUB_TOKEN` write permissions for GitHub releases ([Settings > Actions > General](https://github.com/gjuchault/typescript-library-starter/settings/actions) > Workflow permissions)

## Features

### Node.js, npm version

TypeScript Library Starter relies on [Volta](https://volta.sh/) to ensure the Node.js version is consistent across developers. It's also used in the GitHub workflow file.

### TypeScript

Leverages [esbuild](https://github.com/evanw/esbuild) for blazing-fast builds but keeps `tsc` to generate `.d.ts` files.
Generates a single ESM build.

Commands:

- `build`: runs type checking, then ESM and `d.ts` files in the `build/` directory
- `clean`: removes the `build/` directory
- `type:dts`: only generates `d.ts`
- `type:check`: only runs type checking
- `type:build`: only generates ESM

### Tests

TypeScript Library Starter uses [Node.js's native test runner](https://nodejs.org/api/test.html). Coverage is done using [c8](https://github.com/bcoe/c8) but will switch to Node.js's one once out.

Commands:

- `test`: runs test runner
- `test:watch`: runs test runner in watch mode
- `test:coverage`: runs test runner and generates coverage reports

### Format & lint

This template relies on [Biome](https://biomejs.dev/) to do both formatting & linting in no time.
It also uses [cspell](https://github.com/streetsidesoftware/cspell) to ensure correct spelling.

Commands:

- `format`: runs Prettier with automatic fixing
- `format:check`: runs Prettier without automatic fixing (used in CI)
- `lint`: runs Biome with automatic fixing
- `lint:check`: runs Biome without automatic fixing (used in CI)
- `spell:check`: runs spell checking

### Releasing

Under the hood, this library uses [semantic-release](https://github.com/semantic-release/semantic-release) and [Commitizen](https://github.com/commitizen/cz-cli).
The goal is to avoid manual release processes. Using `semantic-release` will automatically create a GitHub release (hence tags) as well as an npm release.
Based on your commit history, `semantic-release` will automatically create a patch, feature, or breaking release.

Commands:

- `cz`: interactive CLI that helps you generate a proper git commit message, using [Commitizen](https://github.com/commitizen/cz-cli)
- `semantic-release`: triggers a release (used in CI)
