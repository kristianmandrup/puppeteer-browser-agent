import type { IDriverAction } from "../actions";
import { BaseResponseHandler, type IBaseResponseHandler } from "./base-handler";

export type FnArgs = Record<string, any>;

export interface IFunctionResponseHandler extends IBaseResponseHandler {}

export class FunctionResponseHandler
	extends BaseResponseHandler
	implements IFunctionResponseHandler
{
	actionId?: string;
	fn?: any;
	fnName = "";
	fnArgs: FnArgs = {};
	chatMsg?: string;

	public async handle(step: any) {
		super.handle(step);
		if (!this.isFunctionCallStep()) {
			return;
		}
		this.setFunctionAttributes();
		await this.performAction();
	}

	get contextLengthLimit() {
		return this.driver.contextLengthLimit;
	}

	get context() {
		return this.driver.context;
	}

	protected setFunctionAttributes() {
		this.fn = this.step.function_call;
		this.fnName = this.fn.name;
		this.fnArgs = this.parseArgs();
	}

	protected parseArgs() {
		const fn = this.fn;
		try {
			return JSON.parse(fn.arguments);
		} catch (_err) {
			if (this.fnName === "answer_user") {
				return {
					answer: fn.arguments,
				};
			}
		}
	}

	protected async performAction() {
		try {
			const action = this.findAction();
			action.setState({ args: this.fnArgs, context: this.context });
			await action.execute();
			return true;
		} catch (err: any) {
			this.log(err.message || `Action error ${this.actionId}`);
			return false;
		}
	}

	protected log(msg: string) {
		this.driver.log(msg);
	}

	protected communicateMessage(msg: string) {
		const message = msg.substring(0, this.contextLengthLimit);
		this.chatMsg = msg ?? {
			role: "function",
			name: this.fnName,
			content: JSON.stringify({
				status: "OK",
				message: message,
			}),
		};
	}

	protected handleAction() {
		this.performAction() || this.defaultAction();
	}

	protected defaultAction() {
		this.communicateMessage(
			"That is an unregistered or invalid action. Please use a valid one",
		);
	}

	protected findAction(): IDriverAction {
		if (!this.actionId) {
			throw new Error("Missing action id");
		}
		const action = this.actions[this.actionId];
		if (!action) {
			throw new Error(`Action ${this.actionId} is not registered`);
		}
		return action;
	}

	get actions() {
		return this.driver.actions;
	}
}
