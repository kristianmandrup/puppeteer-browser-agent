import type { AgentDriver, Context, FnArgs } from "..";
import type { DebugOpts } from "../../../types";

export interface IDriverAction {
	execute(): Promise<void>;
}
export abstract class BaseDriverAction implements IDriverAction {
	driver: AgentDriver;
	fnArgs: FnArgs = {};
	context: Context = [];
	debug = false;
	taskPrefix?: string;
	message?: string;

	constructor(
		driver: AgentDriver,
		fnArgs: FnArgs,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		context: any[],
		opts: DebugOpts = {},
	) {
		this.driver = driver;
		this.fnArgs = fnArgs;
		this.context = context;
		this.debug = Boolean(opts.debug);
	}

	setMessage(message: string) {
		this.message = message;
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
