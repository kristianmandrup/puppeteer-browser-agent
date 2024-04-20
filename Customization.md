## Custom implementation example

A custom browser agent implementation could look something like the following code snippet, where factory methods in each custom class can be used to wire the implementation as needed.

```ts
export class MyAgentPlanner extends AgentPlanner {
  // override as necessary

  protected createDriver() {
    this.driver = new MyAgentDriver(this, this.opts);
  }

  protected createMessageBroker() {
    return new MyMessageBroker(this.driver);
  }
}

export class MyMessageBroker extends MessageBroker {
  // override as necessary

  protected createController() {
    return new MyAIController(this.driver, definitions, this.opts);
  }

  protected createTokenCostCalculator() {
    return new MyAITokenCostCalculator(this.driver, this.opts);
  }
}

// Class to control interaction with the AI used to control the puppeteer browser agent
export class MyAIController implements IAIController {
  public async getResponse(
    messages: any[],
    definitions: any[],
    fnCall = "auto"
  ) {
    // ... fetch response from AI
    return await response?.json();
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

  protected createMessageBroker() {
    return new MyMessageBroker(this);
  }

  protected createElementSelector() {
    return new MyElementSelector(this);
  }

  protected createAgentBrowser() {
    return new MyAgentBrowser(this);
  }
}

export class MyStepRunner extends StepRunner {
  // override as necessary

  protected createPageScaper() {
    return new MyPageScaper(this);
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

const { driver } = planer;

// create actions and register them with the driver
const myGotoUrlAction = new MyGotoUrlAction();
driver.registerAction(myGotoUrlAction, "goto_url");

// the following demonstrates using the id param of registerAction to register a special purpose action
const specialConfig = {
  // ...
};
const myGotoUrlAction = new MyGotoUrlAction(specialConfig);
driver.registerAction(myGotoUrlAction, "special_goto_url");
// register more actions as needed

// set action definitions via planner
driver.addDefinitions(definitions);

// configure step runner with a custom response handler
const { stepRunner } = driver;

class MyCustomResponseHandler implements IResponseHandler {
  // ...
  async handle(step: any) {
    // ...
  }
}

const customHandler = new MyCustomResponseHandler();

stepRunner.registerHandler(customHandler);

// run the plan
await planner.runPlan();
```
