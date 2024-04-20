import type { ElementHandle, HTTPResponse, Page } from "puppeteer";
import { AgentBrowser, type IAgentBrowser } from "../agent-browser.js";
import {
	ElementSelector,
	type IElementSelector,
} from "../../elements/element-selector.js";
import {
	type IMessageBuilder,
	MessageBuilder,
} from "./message/message-builder.js";
import type { DebugOpts } from "../../types.js";
import {
	TerminalInputController,
	type IInputController,
} from "./input/cli-input.js";
import {
	type IMessageBroker,
	MessageBroker,
} from "./message/message-broker.js";
import { type IStepRunner, StepRunner } from "./step-runner.js";
import {
	type ITokenCostCalculator,
	OpenAITokenCostCalculator,
} from "../../ai/index.js";
import {
	type TActionStore,
	ActionsRegistry,
	type IActionsRegistry,
} from "./action-registry.js";
import {
	ActionDefinitionsRegistry,
	type IActionDefinitionsRegistry,
} from "./definition-registry.js";
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type Context = any[];
export type StructuredMsg = {
	content: string;
	url: string;
};

export type DriverOpts = DebugOpts & {
	definitions?: any[];
};

export interface IAgentDriver {
	structuredMsg: StructuredMsg;
	context?: any[];
	message?: string;
	createMessageForController(content: string): Promise<void>;
	start(): Promise<void>;
	closeBrowser(): void;
	run(agentState: IAgentState): Promise<void>;
	doStep(linksAndInputs: any, element: any): Promise<void>;
	setMessage(msg: string): void;
	addToMessage(message: string): void;
	getInput(msg: string): Promise<string>;
	getControllerResponse(
		structuredMsg: StructuredMsg,
		context: any,
		actionConfig: any,
	): Promise<any>;
	page?: Page;
	elementSelector: IElementSelector;
	autopilot: boolean;
	noContent: boolean;
	contextLengthLimit: number;
	model: string;
	definitions: any[];
	actions: TActionStore;
	setDefinitions(definitions: any[]): void;
	addDefinition(definition: string): void;
	addDefinitions(definitions: any[]): void;
	printCurrentCost(): void;
	log(msg: any): void;
	browser: IAgentBrowser;
	messageBroker: IMessageBroker;
	inputController: IInputController;
	messageBuilder: IMessageBuilder;
	element?: ElementHandle<Element>;
	setLinksAndInputs(elements: ElementHandle<Element>[]): void;
	setNoContent(val: boolean): void;
}
export interface IAgentState {
	context: any[];
	response: HTTPResponse;
}

export class AgentDriver implements IAgentDriver {
	browser: AgentBrowser;
	page?: Page;
	message?: string;
	autopilot = false;
	contextLengthLimit = 4000;
	model = "gpt-3.5";
	messageToController?: any;
	debug = false;
	agentState?: IAgentState;
	nextStep: any;
	context?: any[] = [];
	elementSelector: IElementSelector;
	messageBuilder: IMessageBuilder;
	inputController: IInputController;
	messageBroker: IMessageBroker;

	stepRunner: IStepRunner;
	costCalculator: ITokenCostCalculator;
	actionsRegistry: IActionsRegistry;
	actionDefinitionsRegistry: IActionDefinitionsRegistry;
	opts: DriverOpts;

	constructor(opts: DriverOpts = {}) {
		this.opts = opts;
		this.debug = Boolean(opts.debug);
		this.browser = this.createAgentBrowser();
		this.elementSelector = this.createElementSelector();
		this.messageBuilder = this.createMessageBuilder();
		this.messageBroker = this.createMessageBroker();
		this.inputController = this.createInputController();
		this.stepRunner = this.createStepRunner();
		this.costCalculator = this.createCostCalculator();
		this.actionsRegistry = this.createActionRegistry();
		this.actionDefinitionsRegistry = this.createActionDefinitionsRegistry();
	}

	get element() {
		return this.stepRunner.element;
	}

	setLinksAndInputs(elements: ElementHandle<Element>[]) {
		this.stepRunner.linksAndInputs = elements;
	}

	get linksAndInputs() {
		return this.stepRunner.linksAndInputs;
	}

	setNoContent(val: boolean) {
		this.stepRunner.noContent = val;
	}

	get noContent() {
		return this.stepRunner.noContent;
	}

	public get definitions() {
		return this.actionDefinitionsRegistry.definitions;
	}

	public get actions() {
		return this.actionsRegistry.actions;
	}

	public setDefinitions(definitions: any[]) {
		this.actionDefinitionsRegistry.setDefinitions(definitions);
	}

	public addDefinitions(definitions: any[]) {
		this.actionDefinitionsRegistry.addDefinitions(definitions);
	}

	public addDefinition(definition: any) {
		this.actionDefinitionsRegistry.addDefinition(definition);
	}

	public async start() {
		await this.initialize();
	}

	public async run(agentState: IAgentState) {
		this.prepareStep(agentState);
		await this.doStep();
		this.onStepDone();
	}

	public async doStep() {
		await this.stepRunner.run(this.response);
	}

	public closeBrowser() {
		this.browser.close();
	}

	public log(msg: any) {
		if (!this.debug) {
			return;
		}
		console.info(msg);
	}

	protected prepareStep(agentState: IAgentState) {
		this.setState(agentState);
	}

	protected onStepDone() {
		this.closeBrowser();
	}

	protected async initialize() {
		this.log("initializing...");
		await this.openBrowserPage();
	}

	protected setState(agentState: IAgentState) {
		this.agentState = agentState;
		this.context = agentState.context;
		this.nextStep = agentState.response;
	}

	get response() {
		return this.agentState?.response;
	}

	protected createActionDefinitionsRegistry() {
		return new ActionDefinitionsRegistry();
	}

	protected createActionRegistry() {
		return new ActionsRegistry(this);
	}

	protected createDefaultInputReader() {
		return {
			question: async (text: string) => text,
		};
	}

	protected createStepRunner() {
		return new StepRunner(this, this.opts);
	}

	protected createMessageBroker() {
		return new MessageBroker(this, this.opts);
	}

	protected createInputController() {
		return new TerminalInputController(this.createDefaultInputReader);
	}

	protected createMessageBuilder() {
		return new MessageBuilder();
	}

	protected createElementSelector() {
		return new ElementSelector(this);
	}

	protected createAgentBrowser() {
		return new AgentBrowser(this);
	}

	protected createCostCalculator() {
		return new OpenAITokenCostCalculator(this);
	}

	protected async openBrowserPage() {
		this.page = await this.browser.start();
	}

	public printCurrentCost() {
		this.costCalculator.printCurrentCost();
	}

	protected get autopilotOn() {
		return this.autopilot;
	}

	protected async getAnswerTo(content: string) {
		if (this.autopilotOn) {
			return await this.getInput(`<!_RESPONSE_!>${JSON.stringify(content)}\n`);
		}
		// biome-ignore lint/style/useTemplate: <explanation>
		return await this.getInput("GPT: " + content + "\nYou: ");
	}

	public async getInput(prompt: string) {
		return await this.inputController.getInput(prompt);
	}

	public addToMessage(message: string) {
		this.message += message;
	}

	// override
	public setMessage(message: string) {
		this.message = message;
		console.info("send", message);
	}

	public async createMessageForController(content: string) {
		const answer = await this.getAnswerTo(content);
		this.message = answer;
		this.messageToController = {
			role: "user",
			content: answer,
		};
	}

	public get structuredMsg(): StructuredMsg {
		return this.messageBuilder.message;
	}

	async getControllerResponse(
		structuredMsg: StructuredMsg,
		context: any,
		actionConfig = {
			name: "auto",
		},
	) {
		await this.messageBroker.getControllerResponse(
			structuredMsg,
			context,
			actionConfig,
		);
	}
}
