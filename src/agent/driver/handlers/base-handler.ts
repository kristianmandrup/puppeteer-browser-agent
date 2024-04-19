import type { DebugOpts } from "../../../types";
import type { IAgentDriver } from "../agent-driver";

export interface IBaseResponseHandler {
	step: any;
	handle(step: any): Promise<void>;
}

export type IResponseHandlerOpts = DebugOpts & {
	//
};

export abstract class BaseResponseHandler implements IBaseResponseHandler {
	step: any;
	driver: IAgentDriver;
	opts: IResponseHandlerOpts;

	constructor(driver: IAgentDriver, opts: IResponseHandlerOpts = {}) {
		this.driver = driver;
		this.opts = opts;
	}

	protected setStep(step: any) {
		this.step = step;
		return this;
	}

	protected isFunctionCallStep() {
		return this.step.function_call;
	}

	// override in subclass
	public async handle(step: any) {
		this.setStep(step);
	}
}
