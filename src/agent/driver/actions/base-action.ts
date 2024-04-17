import type { Context, FnArgs, IAgentDriver } from "../agent-driver";
import type { DebugOpts } from "../../../types";

export interface IDriverAction {
	execute(): Promise<void>;
}

export type IDriverActionOpts = DebugOpts & {
	definition?: any;
};

export abstract class BaseDriverAction implements IDriverAction {
	driver: IAgentDriver;
	fnArgs: FnArgs = {};
	context: Context = [];
	debug = false;
	taskPrefix?: string;
	message?: string;
	definition: any;
	opts: IDriverActionOpts;

	constructor(
		driver: IAgentDriver,
		fnArgs: FnArgs,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		context: any[],
		opts: IDriverActionOpts = {},
	) {
		this.driver = driver;
		this.opts = opts;
		this.fnArgs = fnArgs;
		this.context = context;
		this.debug = Boolean(opts.debug);
		this.definition = opts.definition;
	}

	setMessage(message: string) {
		this.message = message;
	}

	addToMessage(message: string) {
		this.message += message;
	}

	get page() {
		return this.driver.page;
	}

	// biome-ignore lint/suspicious/useAwait: <explanation>
	public async execute() {
		this.log("Action: To be implemented");
	}

	protected get autopilot() {
		return this.driver.autopilot;
	}

	protected async getInput(msg: string) {
		return await this.driver.getInput(msg);
	}

	// biome-ignore lint/suspicious/useAwait: <explanation>
	protected sendMessage(msg: string) {
		this.driver.sendMessage(msg);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	protected log(msg: any) {
		if (!this.debug) {
			return;
		}
		console.info(msg);
	}
}
