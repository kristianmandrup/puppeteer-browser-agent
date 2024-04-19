import type { IDriverAction } from "./actions";
import type { IAgentDriver } from "./agent-driver";

export type TActionStore = Record<string, IDriverAction>;

export interface IActionsRegistry {
	actions: TActionStore;

	registerAction(action: IDriverAction, id?: string): void;
	removeAction(id: string): void;
}

export class ActionsRegistry {
	driver: IAgentDriver;
	actions: TActionStore = {};

	constructor(driver: IAgentDriver) {
		this.driver = driver;
	}

	public registerAction(action: IDriverAction, id?: string) {
		const actionId = id || action.name;
		this.actions[actionId] = action;
		if (action.definition) {
			this.addDefinition(action.definition);
		}
	}

	public removeAction(id: string) {
		delete this.actions[id];
	}

	protected addDefinition(definition: string) {
		this.driver.addDefinition(definition);
	}
}
