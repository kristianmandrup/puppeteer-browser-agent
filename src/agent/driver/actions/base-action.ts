import type { Context, FnArgs, IAgentDriver } from "../agent-driver";
import type { DebugOpts } from "../../../types";

export interface IDriverAction {
	execute(): Promise<void>;
	definition: any;
	name: string;
	setState({ args, context }: { args: any; context: any }): void;
}

export type IDriverActionOpts = DebugOpts & {
	definition?: any;
};

export abstract class BaseDriverAction implements IDriverAction {
	driver: IAgentDriver;
	fnArgs: FnArgs = {};
	context: Context = [];
	debug = false;
	definition: any;
	opts: IDriverActionOpts;
	taskPrefix = "";
	name = "unknown";

	constructor(driver: IAgentDriver, opts: IDriverActionOpts = {}) {
		this.driver = driver;
		this.opts = opts;
		this.debug = Boolean(opts.debug);
		this.definition = opts.definition;

		this.baseInit();
		this.initialize();
	}

	protected updateState() {}

	public setState({ args, context }: { args: any; context: any }) {
		this.setContext(context);
		this.setArgs(args);
	}

	protected setContext(context: any[]) {
		this.context = context;
		this.updateState();
	}

	protected setArgs(args: any) {
		this.fnArgs = args;
		this.updateState();
	}

	protected get prefix(): string | undefined {
		return this.taskPrefix;
	}

	// biome-ignore lint/suspicious/useAwait: <explanation>
	public async execute() {
		this.log("Action: To be implemented");
	}

	protected baseInit() {
		if (this.autopilot) {
			this.taskPrefix = "<!_TASK_!>";
		}
	}

	// override as needed
	protected initialize() {}

	protected addToMessage(message: string) {
		this.driver.addToMessage(message);
	}

	protected get page() {
		return this.driver.page;
	}

	protected get autopilot() {
		return this.driver.autopilot;
	}

	protected async getInput(msg: string) {
		return await this.driver.getInput(msg);
	}

	resetMessage() {
		this.driver.setMessage("");
	}

	// biome-ignore lint/suspicious/useAwait: <explanation>
	protected setMessage(msg: string) {
		this.driver.setMessage(msg);
	}

	protected logTask(msg: any) {
		this.log(`${this.prefix}${msg}`);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	protected log(msg: any) {
		if (!this.debug) {
			return;
		}
		console.info(msg);
	}
}
