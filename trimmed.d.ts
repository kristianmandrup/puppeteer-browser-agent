import type { Browser } from 'puppeteer';
import { CheerioAPI } from 'cheerio';
import { Element as Element_2 } from 'cheerio';
import { ElementHandle } from 'puppeteer';
import type { HTTPRequest } from 'puppeteer';
import type { HTTPResponse } from 'puppeteer';
import { Page } from 'puppeteer';
import type { PuppeteerLifeCycleEvent } from 'puppeteer';
import type { Viewport } from 'puppeteer';

export declare type ActionConfig = {
    name: string;
    arguments?: string[];
};

export declare class AgentBrowser implements IAgentBrowser {
    page?: Page;
    launched: boolean;
    loaded: boolean;
    debug: boolean;
    headless: boolean;
    downloadStarted: boolean;
    responses: number;
    requests: number;
    view: ViewportOpts;
    browser?: Browser;
    driver: IAgentDriver;
    constructor(driver: IAgentDriver, opts?: BrowserOpts);
    launch(): Promise<void>;
    getNewPage(): Promise<Page | undefined>;
    createPuppeteerBrowser(): Promise<Browser>;
    start(): Promise<Page>;
    close(): void;
    protected get defaultViewport(): {
        width: number;
        height: number;
        deviceScaleFactor: number;
    };
    get viewport(): Viewport;
    protected print(...msgs: any[]): void;
    protected isBlock(_request: HTTPRequest): boolean;
    protected onRequestBlock(request: HTTPRequest): void;
    protected incRequestCount(): void;
    protected startDownload(): void;
    protected isLargeResponse(response: HTTPResponse): boolean;
    protected isBinary(headers: PageHeaders): boolean;
    protected hasAttachment(headers: PageHeaders): boolean;
    protected hasLargeContent(headers: PageHeaders): boolean;
    protected get maxMbs(): number;
    protected incResponseCount(): void;
    protected sleep(ms: number, debug?: boolean): Promise<unknown>;
}

export declare class AgentDriver implements IAgentDriver {
    browser: AgentBrowser;
    page?: Page;
    message?: string;
    contextLengthLimit: number;
    chatMsg?: string;
    fn?: any;
    fnName: string;
    fnArgs: FnArgs;
    autopilot: boolean;
    model: string;
    aiMsg?: any;
    debug: boolean;
    noContent: boolean;
    context?: string[];
    elementSelector: IElementSelector;
    messageBuilder: IMessageBuilder;
    inputController: IInputController;
    messageSender: IMessageSender;
    actions: Record<string, IDriverAction>;
    pageScraper: IPageScraper;
    definitions: any[];
    opts: DriverOpts;
    constructor(opts?: DriverOpts);
    createMessageSender(): MessageSender;
    setDefinitions(definitions: any[]): void;
    addDefinition(definition: any, overwrite?: boolean): void;
    addDefinitions(definitions: any[], overwrite?: boolean): void;
    defaultDefinitions(): ({
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                plan: {
                    type: string;
                    description: string;
                };
                filename?: undefined;
                url?: undefined;
                text?: undefined;
                pgpt_id?: undefined;
                form_data?: undefined;
                submit?: undefined;
                summary?: undefined;
                answer?: undefined;
            };
        };
        required: string[];
    } | {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                filename: {
                    type: string;
                    description: string;
                };
                plan?: undefined;
                url?: undefined;
                text?: undefined;
                pgpt_id?: undefined;
                form_data?: undefined;
                submit?: undefined;
                summary?: undefined;
                answer?: undefined;
            };
        };
        required: string[];
    } | {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                url: {
                    type: string;
                    description: string;
                };
                plan?: undefined;
                filename?: undefined;
                text?: undefined;
                pgpt_id?: undefined;
                form_data?: undefined;
                submit?: undefined;
                summary?: undefined;
                answer?: undefined;
            };
        };
        required: string[];
    } | {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                text: {
                    type: string;
                    description: string;
                };
                pgpt_id: {
                    type: string;
                    description: string;
                };
                plan?: undefined;
                filename?: undefined;
                url?: undefined;
                form_data?: undefined;
                submit?: undefined;
                summary?: undefined;
                answer?: undefined;
            };
        };
        required: string[];
    } | {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                form_data: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            pgpt_id: {
                                type: string;
                                description: string;
                            };
                            text: {
                                type: string;
                                description: string;
                            };
                        };
                    };
                };
                submit: {
                    type: string;
                    description: string;
                };
                plan?: undefined;
                filename?: undefined;
                url?: undefined;
                text?: undefined;
                pgpt_id?: undefined;
                summary?: undefined;
                answer?: undefined;
            };
        };
        required: string[];
    } | {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                summary: {
                    type: string;
                    description: string;
                };
                answer: {
                    type: string;
                    description: string;
                };
                plan?: undefined;
                filename?: undefined;
                url?: undefined;
                text?: undefined;
                pgpt_id?: undefined;
                form_data?: undefined;
                submit?: undefined;
            };
        };
        required: string[];
    })[];
    createDefaultInputReader(): {
        question: (text: string) => Promise<string>;
    };
    protected createInputController(): TerminalInputController;
    protected createMessageBuilder(): MessageBuilder;
    protected createElementSelector(): ElementSelector;
    protected createAgentBrowser(): AgentBrowser;
    registerAction(label: string, action: IDriverAction): void;
    removeAction(label: string): void;
    start(): Promise<void>;
    run(context: string[], response: HTTPResponse): Promise<void>;
    closeBrowser(): void;
    protected initialize(): void;
    protected openBrowserPage(): Promise<Page>;
    protected parseArgs(): any;
    protected handleAction(actionName: string): void;
    protected defaultAction(): void;
    protected findAction(label: string): IDriverAction;
    protected performAction(label: string): boolean;
    protected communicateMessage(msg: string): void;
    protected doFunction(nextStep: any): boolean;
    protected printCurrentCost(): void;
    protected get autopilotOn(): boolean;
    protected notFunction(nextStep: any): Promise<void>;
    protected createMessage(content: string): Promise<string>;
    getInput(prompt: string): Promise<string>;
    protected setAiMessage(nextContent: string): Promise<void>;
    sendMessage(msg: string): void;
    doStep(context: string[], nextStep: any, linksAndInputs: any, element: any): Promise<void>;
    protected createPageScraper(): PageScraper;
    log(msg: any): void;
    protected logContext(): void;
    protected hasContent(): boolean;
    protected getPageContent(): Promise<string>;
    protected addPageContent(pageContent: string): void;
    protected get msg(): StructuredMsg;
    protected performInteraction(): Promise<void>;
    addToContext(data: any): void;
    sendContextualMessage(structuredMsg: StructuredMsg, context: any, actionConfig?: {
        name: string;
    }): Promise<void>;
}

export declare class AgentPlanner implements IAgentPlanner {
    context: any[];
    aiAgentResponse?: any;
    assignedMsg?: AssignedMsg;
    promptMessage?: string;
    promptText?: string;
    driver: IAgentDriver;
    debug: boolean;
    msg: {};
    acceptPlan?: string;
    autopilot: boolean;
    messageSender?: IMessageSender;
    model: string;
    opts: PlannerOpts;
    constructor(context: any, opts?: PlannerOpts);
    get definitions(): any[];
    setDefinitions(definitions: any[]): void;
    runPlan(): Promise<void>;
    protected createMessageSender(): MessageSender;
    protected createInitialContext(): {
        role: string;
        content: string;
    }[];
    protected isPlanAccepted(): boolean;
    start(): Promise<void>;
    protected createDriver(): AgentDriver;
    protected startDriver(): Promise<void>;
    protected get browser(): IAgentBrowser;
    protected logContext(): void;
    protected addToContext(item: unknown): void;
    protected addMessageToContext(msg: unknown): void;
    protected addResponseToContext(response: HTTPResponse): void;
    protected getAgentResponse(): Promise<void>;
    protected sendMessageToController(msg: any, context: any, actionConfig: any): void;
    protected handleAcceptPlan(): Promise<void>;
    protected getInput(prompt: string): Promise<string>;
    protected handleArgs(args: any): void;
    protected print(data: any): void;
}

declare interface AIMessageRedacter {
    redactMessages(messages: any[]): string[];
}

declare type AiResponseData = {
    choices: any[];
    usage: TokenUsage;
};

export declare type AssignedMsg = {
    role: string;
    content: string;
};

export declare abstract class BaseDriverAction implements IDriverAction {
    driver: IAgentDriver;
    fnArgs: FnArgs;
    context: Context;
    debug: boolean;
    taskPrefix?: string;
    message?: string;
    definition: any;
    opts: IDriverActionOpts;
    constructor(driver: IAgentDriver, fnArgs: FnArgs, context: any[], opts?: IDriverActionOpts);
    protected initialize(): void;
    setMessage(message: string): void;
    addToMessage(message: string): void;
    get page(): Page | undefined;
    execute(): Promise<void>;
    protected get autopilot(): boolean;
    protected getInput(msg: string): Promise<string>;
    protected sendMessage(msg: string): void;
    protected log(msg: any): void;
}

declare type BrowserOpts = {
    debug?: boolean;
    headless?: boolean;
    viewport?: ViewportOpts;
};

export declare class ClickLinkAction extends ElementAction implements IClickLinkAction {
    message: string;
    link?: HTMLAnchorElement;
    linkId?: string;
    linkText?: string;
    userMsg?: string;
    linksAndInputs: any;
    url?: string;
    requestCount: number;
    responseCount: number;
    downloadStarted: boolean;
    navigator: IPageNavigator;
    constructor(driver: IAgentDriver, fnArgs: FnArgs, context: Context, linksAndInputs: any[]);
    protected createNavigator(): PageNavigator;
    protected missingLinkId(): void;
    missingLinkText(): void;
    findLink(): any;
    get page(): Page | undefined;
    onStart(linkText?: string): void;
    initAction(): void;
    get linkElementSelector(): string;
    action(): void;
    onTimeOutError(_link?: HTMLAnchorElement): void;
    onError(link: any): void;
    clickLink(): Promise<void>;
    clickOnPage(): void;
    waitForNavigation(): Promise<void>;
    onLinkNavigation(): void;
    onDownloadStarted(): true | undefined;
    execute(): Promise<void>;
    validatePage(): void;
    scrapePage(): Promise<void>;
    getElementsOn(page: Page): Promise<ElementHandle<Element>[]>;
}

export declare type Context = any[];

declare type DebugOpts = {
    debug?: boolean;
};

export declare const definitions: ({
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            plan: {
                type: string;
                description: string;
            };
            filename?: undefined;
            url?: undefined;
            text?: undefined;
            pgpt_id?: undefined;
            form_data?: undefined;
            submit?: undefined;
            summary?: undefined;
            answer?: undefined;
        };
    };
    required: string[];
} | {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            filename: {
                type: string;
                description: string;
            };
            plan?: undefined;
            url?: undefined;
            text?: undefined;
            pgpt_id?: undefined;
            form_data?: undefined;
            submit?: undefined;
            summary?: undefined;
            answer?: undefined;
        };
    };
    required: string[];
} | {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            url: {
                type: string;
                description: string;
            };
            plan?: undefined;
            filename?: undefined;
            text?: undefined;
            pgpt_id?: undefined;
            form_data?: undefined;
            submit?: undefined;
            summary?: undefined;
            answer?: undefined;
        };
    };
    required: string[];
} | {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            text: {
                type: string;
                description: string;
            };
            pgpt_id: {
                type: string;
                description: string;
            };
            plan?: undefined;
            filename?: undefined;
            url?: undefined;
            form_data?: undefined;
            submit?: undefined;
            summary?: undefined;
            answer?: undefined;
        };
    };
    required: string[];
} | {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            form_data: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        pgpt_id: {
                            type: string;
                            description: string;
                        };
                        text: {
                            type: string;
                            description: string;
                        };
                    };
                };
            };
            submit: {
                type: string;
                description: string;
            };
            plan?: undefined;
            filename?: undefined;
            url?: undefined;
            text?: undefined;
            pgpt_id?: undefined;
            summary?: undefined;
            answer?: undefined;
        };
    };
    required: string[];
} | {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            summary: {
                type: string;
                description: string;
            };
            answer: {
                type: string;
                description: string;
            };
            plan?: undefined;
            filename?: undefined;
            url?: undefined;
            text?: undefined;
            pgpt_id?: undefined;
            form_data?: undefined;
            submit?: undefined;
        };
    };
    required: string[];
})[];

export declare class DocumentTraverser implements IDocumentTraverser {
    html?: string;
    $: CheerioAPI;
    driver: IAgentDriver;
    formatter: IHtmlFormatter;
    debug: boolean;
    opts: DebugOpts;
    elementTypeHandler: IElementTypeHandler;
    constructor(driver: IAgentDriver, opts?: DebugOpts);
    createElementTypeHandler(): ElementTypeHandler;
    formatHtml(bodyHtml: string): CheerioAPI;
    createFormatter(): HtmlFormatter;
    initialize(html: string): void;
    start(html: string): string;
    traverse(element: Element_2): string;
}

export declare type DriverOpts = DebugOpts & {
    definitions?: any[];
};

declare abstract class ElementAction extends BaseDriverAction implements IDriverAction {
    protected getTabbableElements(): Promise<ElementHandle<Element>[]>;
    protected get elementSelector(): IElementSelector;
}

export declare class ElementEvaluator {
    element: Element;
    id: number;
    selector: string;
    role: string | null;
    placeholder?: string;
    textContent?: string;
    type?: string;
    value?: string;
    href?: string;
    title?: string;
    driver: IAgentDriver;
    debug: boolean;
    opts: DebugOpts;
    constructor(driver: IAgentDriver, element: Element, id: number, selector: string, opts?: DebugOpts);
    evaluate(): Element | undefined;
    configure(): void;
    titledElement(): void;
    externalRefElem(): void;
    formElement(): void;
    text(): void;
    ignoreElement(): boolean;
}

export declare class ElementSelector implements IElementSelector {
    page?: Page;
    interactiveElementHandler: InteractiveElementHandler;
    skipped: ElementHandle<Element>[];
    selected: ElementHandle<Element>[];
    debug: boolean;
    driver: IAgentDriver;
    constructor(driver: IAgentDriver, opts?: SelectorOpts);
    getElements(page: Page, selector?: string): Promise<ElementHandle<Element>[]>;
    protected createInteractiveElementHandler(): InteractiveElementHandler;
    protected get elementSelector(): string;
    protected getNext(element: any, id: number, selector: string): Promise<false | Element>;
    protected skipElement(element: ElementHandle<Element>): void;
    protected selectElement(element: ElementHandle<Element>): void;
    protected writeElements(fileName: string, elements: ElementHandle<Element>[]): void;
    protected logElements(): void;
}

export declare class ElementTypeHandler implements IElementTypeHandler {
    element?: Element_2;
    docTraverser: IDocumentTraverser;
    output: string;
    driver: IAgentDriver;
    tagBuilder: ITagBuilder;
    debug: boolean;
    opts: DebugOpts;
    constructor(driver: IAgentDriver, docTraverser: DocumentTraverser, opts?: DebugOpts);
    handle(element: Element_2): string;
    protected get $(): CheerioAPI;
    protected addToOutput(text: string): void;
    protected handleHeaderElement(): void;
    protected handleFormElement(): void;
    protected handleSections(): void;
    protected handleHeadersAndSectionElements(): void;
    protected makeTag(element?: Element_2): any;
    protected createTagBuilder(): TagBuilder;
    protected handleSpecialAttr(elemTag: any): boolean;
    protected handleNonSpecialTag(): boolean;
    protected handleMisc(): void;
    protected traverse(element: Element_2): string;
    protected handleChildren(): void;
    protected formatOutput(): string;
}

export declare type FnArgs = Record<string, any>;

export declare class GotoUrlAction extends ElementAction implements IGotoUrlAction {
    waitUntil: PuppeteerLifeCycleEvent;
    linksAndInputs?: ElementHandle<Element>[];
    onStart(url: string): void;
    execute(): Promise<void>;
    onStartScraping(): void;
    get defaultGotoErrorMessage(): string;
    protected getTabbableElements(): Promise<ElementHandle<Element>[]>;
    downloadError(error: unknown): string | undefined;
}

export declare type GotoUrlOpts = DebugOpts & {};

export declare class HtmlFormatter implements IHtmlFormatter {
    html?: string;
    $?: CheerioAPI;
    debug: boolean;
    driver: IAgentDriver;
    constructor(driver: IAgentDriver, opts?: DebugOpts);
    protected get prioritySelectors(): string[];
    format(html: string): CheerioAPI;
}

export declare interface IAgentBrowser {
    launch(): Promise<void>;
    start(): Promise<Page>;
    close(): void;
}

export declare interface IAgentDriver {
    registerAction(label: string, action: IDriverAction): void;
    removeAction(label: string): void;
    start(): Promise<void>;
    closeBrowser(): void;
    run(context: string[], response: HTTPResponse): Promise<void>;
    doStep(context: string[], nextStep: any, linksAndInputs: any, element: any): Promise<void>;
    sendMessage(msg: string): void;
    getInput(msg: string): Promise<string>;
    page?: Page;
    elementSelector: IElementSelector;
    autopilot: boolean;
    browser: IAgentBrowser;
    model: string;
    definitions: any[];
    setDefinitions(definitions: any[]): void;
    addDefinitions(definitions: any[]): void;
    inputController: IInputController;
    log(msg: any): void;
    messageSender: IMessageSender;
}

export declare interface IAgentPlanner {
    runPlan(): Promise<void>;
}

declare interface IAIController {
    getResponse(messages: any[], definitions: any[], fnCall: any): Promise<any>;
}

export declare interface IClickLinkAction extends IDriverAction {
}

export declare type ICreateTerminalReader = () => ITerminalReader;

export declare interface IDocumentTraverser {
    $: CheerioAPI;
    start(html: string): string;
    traverse(element: Element_2): string;
}

export declare interface IDriverAction {
    execute(): Promise<void>;
    definition: any;
}

export declare type IDriverActionOpts = DebugOpts & {
    definition?: any;
};

export declare interface IElementSelector {
    getElements(page: Page, selector?: string): Promise<ElementHandle<Element>[]>;
}

export declare interface IElementTypeHandler {
    handle(element: Element_2): string;
}

export declare interface IGotoUrlAction extends IDriverAction {
}

export declare interface IHtmlFormatter {
    format(html: string): CheerioAPI;
}

export declare interface IInputController {
    getInput(text: string): Promise<string>;
}

export declare interface IMessageBuilder {
    message: StructuredMsg;
    setContent(content?: string): void;
    addContent(content: string): void;
    setUrl(url: string): void;
}

export declare interface IMessageSender {
    sendMessageToController(message: unknown, context: any, actionConfig: ActionConfig): Promise<unknown>;
}

export declare class InteractiveElementHandler {
    driver: IAgentDriver;
    debug: boolean;
    opts: DebugOpts;
    constructor(driver: IAgentDriver, opts?: DebugOpts);
    get page(): Page | undefined;
    onEvaluate: (element: Element, id: number, selector: string) => Promise<Element | undefined>;
    createElementEvaluator(element: Element, id: number, selector: string): ElementEvaluator;
    nextInteractiveElement(element: any, id: number, selector?: string): Promise<false | Element>;
    addBoundingBoxTo(element: Element, id: number): void;
}

export declare interface IPageNavigator {
    waitForNavigation(page: Page): Promise<void>;
}

export declare interface IPageScraper {
    getPageContent(page: Page): Promise<string>;
}

export declare type IQuestionFn = (text: string) => Promise<string>;

export declare interface IReadFileAction extends IDriverAction {
    readFile(): Promise<boolean>;
}

export declare interface IReceiveInputAction extends IDriverAction {
    receiveInput(msg: string): Promise<string>;
}

export declare interface ISumbitFormAction extends IDriverAction {
}

export declare interface ITagBuilder {
    build(element: Element_2): any;
}

export declare interface ITerminalReader {
    question: IQuestionFn;
}

declare interface ITokenCostCalculator {
    tokenCost(promptTokens: number, completionTokens: number): number;
    printCurrentCost(): void;
}

export declare class MessageBuilder implements IMessageBuilder {
    content: string;
    url: string;
    get message(): StructuredMsg;
    setContent(content?: string): void;
    addContent(content: string): void;
    setUrl(url: string): void;
}

export declare class MessageSender implements IMessageSender {
    debug: boolean;
    messages: unknown[];
    tokenUsage: TokenUsage;
    taskPrefix: string;
    autopilot: boolean;
    opts: DebugOpts;
    model: string;
    calculator?: ITokenCostCalculator;
    actions: any[];
    controller?: IAIController;
    driver: IAgentDriver;
    constructor(driver: IAgentDriver, opts?: MessageSenderOpts);
    get definitions(): any[];
    sendMessageToController(message: unknown, context: any, actionConfig: ActionConfig): Promise<any>;
    get costLimits(): {
        min: number;
    };
    protected createController(): OpenAIController;
    protected createTokenCostCalculator(): OpenAITokenCostCalculator;
    protected logMessageContext(messages: unknown): void;
    protected filterDefinitions(actions?: string[], definitions?: any[]): any[];
    protected getAiResponseData(actionConfig: ActionConfig, filteredDefinitions: any[]): Promise<any>;
    protected getController(): void;
    protected print(data: any): void;
    protected handleInvalidData(data: any): void;
    protected formatResponseData(data: any): void;
    protected calculateTokenCost(data: any): number | undefined;
    protected tokenCost(promptTokens: number, completionTokens: number): number | undefined;
    protected handleCost(cost: number, data: any): void;
    protected round(cost: number, decimals?: number): string;
    protected getMessageFromAiData(data: AiResponseData): any;
    protected onAutoPilotActivated(data: AiResponseData): void;
}

export declare type MessageSenderOpts = DebugOpts;

declare type Obj = Record<string, string | undefined>;

declare class OpenAIController {
    definitions: any[];
    debug: boolean;
    model: string;
    redacter: OpenAIMessageRedacter;
    opts: DebugOpts;
    get openaiApiKey(): string | undefined;
    constructor(driver: IAgentDriver, definitions?: any[], opts?: DebugOpts);
    get apiEndpoint(): string;
    redactMessages(messages: any[]): void;
    getResponse(messages: any[], definitions: any[], fnCall?: string): Promise<any>;
    print(data: any): void;
}

declare class OpenAIMessageRedacter implements AIMessageRedacter {
    currentUrl: string;
    debug: boolean;
    driver: IAgentDriver;
    constructor(driver: IAgentDriver, opts: DebugOpts);
    redactMessages(messages: any[]): any[];
    redactMessage(message: any): any;
    logRedacted(redactedMessages: any[]): void;
}

declare class OpenAITokenCostCalculator {
    tokenUsage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    driver: IAgentDriver;
    model: string;
    debug: boolean;
    constructor(driver: IAgentDriver, opts?: DebugOpts);
    printCurrentCost(): void;
    tokenCost(promptTokens: number, completionTokens: number): number;
    protected getTokenPrice(model: string, direction: string): number;
    protected round(num: number, decimals?: number): string;
    protected print(message?: string): void;
}

declare type PageHeaders = Record<string, string>;

export declare class PageNavigator implements IPageNavigator {
    navigationTimeout: number;
    waitUntil: PuppeteerLifeCycleEvent;
    debug: boolean;
    driver: IAgentDriver;
    opts: PageNavigatorOpts;
    constructor(driver: IAgentDriver, opts?: PageNavigatorOpts);
    get defaults(): {
        navigationTimeout: number;
    };
    waitForNavigation(page: Page): Promise<void>;
    log(msg: string): void;
    onError(_error: any): void;
}

export declare type PageNavigatorOpts = DebugOpts & {
    navigationTimeout?: number;
};

export declare class PageScraper implements IPageScraper {
    debug: boolean;
    opts: DebugOpts;
    driver: IAgentDriver;
    documentTraverser: IDocumentTraverser;
    constructor(driver: IAgentDriver, opts?: DebugOpts);
    createDocumentTraverser(): DocumentTraverser;
    getPageContent(page: Page): Promise<string>;
    formatHtml(html: string): string;
}

export declare type PlannerOpts = DebugOpts & {
    model?: string;
};

export declare class ReadFileAction extends BaseDriverAction implements IReadFileAction {
    filename?: string;
    contextLengthLimit: number;
    skipFile: boolean;
    onStartTask(): void;
    readFile(): Promise<boolean>;
    getFileData(): Promise<string>;
    contentFromFileData(fileData: string): string;
    handleReadError(_error: any): void;
    attemptToReadFile(): Promise<void>;
    handleCannotReadFile(): void;
    execute(): Promise<void>;
    getInput(msg: string): Promise<string>;
    get askToReadFileMsg(): string;
    shouldReadFile(): Promise<string | true>;
}

export declare class ReceiveInputAction extends BaseDriverAction implements IReceiveInputAction {
    costCalculator?: ITokenCostCalculator;
    text?: string;
    protected initialize(): void;
    protected createCostCalculator(): OpenAITokenCostCalculator;
    execute(): Promise<void>;
    protected setText(text?: string): void;
    protected textFromFnArgs(): any;
    protected get userMsg(): string;
    protected get autoPilotMsg(): string;
    receiveInput(msg: string): Promise<string>;
    protected printCurrentCost(): void;
}

export declare type ResponseData = {
    usage: TokenUsage;
};

declare type SelectorOpts = {
    debug?: boolean;
};

export declare type StructuredMsg = {
    content: string;
    url: string;
};

export declare class SubmitFormAction extends ElementAction implements ISumbitFormAction {
    formData: any;
    prevInput: any;
    linksAndInputs: ElementHandle<Element>[];
    navigator: IPageNavigator;
    constructor(driver: IAgentDriver, fnArgs: FnArgs, context: any[], opts?: DebugOpts);
    protected createNavigator(): PageNavigator;
    selectElement(elementCssSelector: string): Promise<ElementHandle<Element> | null | undefined>;
    getElementAttr(element: ElementHandle<Element>, attrName: string): Promise<string>;
    getElementType(element: ElementHandle<Element>): Promise<string>;
    getElementName(element: ElementHandle<Element>): Promise<string>;
    getElementTagName(element: ElementHandle<Element>): Promise<string>;
    onSubmittable(tagName: string, type?: string): boolean;
    onIputField(element: ElementHandle, data: any): Promise<void>;
    resetMessage(): void;
    execute(): Promise<void>;
    protected waitForNavigation(): Promise<void>;
    protected onSubmit(): Promise<void>;
    onSubmitFormError(error: any): void;
}

export declare class TagBuilder implements ITagBuilder {
    element: any;
    tagName?: string;
    value?: string;
    role?: string;
    type?: string;
    id?: string;
    tag?: string;
    title?: string;
    href?: string;
    placeholder?: string;
    textContent?: string;
    obj: Obj;
    driver: IAgentDriver;
    opts: DebugOpts;
    constructor(driver: IAgentDriver, opts?: DebugOpts);
    initialize(): void;
    build(element: Element_2): Obj;
    createObj(): Obj;
    setTag(): void;
    setTextContent(): void;
    setPlaceholder(): void;
    setTitle(): void;
    setHref(): void;
}

export declare class TerminalInputController implements IInputController {
    createReader: ICreateTerminalReader;
    constructor(createReader: any);
    getInput(text: string): Promise<string>;
}

declare type TokenUsage = {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
};

declare type ViewportOpts = {
    width?: number;
    height?: number;
    scaleFactor?: number;
};

export { }
