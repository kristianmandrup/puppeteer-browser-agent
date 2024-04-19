import { actionDefinitions } from "./definitions.js";

export interface IActionDefinitionsRegistry {
	definitions: any[];
	setDefinitions(definitions: any[]): void;
	addDefinition(definition: any, overwrite?: boolean): void;
	addDefinitions(definitions: any[], overwrite?: boolean): void;
}

export class ActionDefinitionsRegistry {
	definitions: any[] = [];

	public setDefinitions(definitions: any[]) {
		this.definitions = definitions;
	}

	public addDefinition(definition: any, overwrite = false) {
		if (!definition) {
			return;
		}
		if (Array.isArray(definition)) {
			this.addDefinitions(definition, overwrite);
			return;
		}
		this.addDefinitions([definition], overwrite);
	}

	public addDefinitions(definitions: any[], overwrite = false) {
		for (const definition of definitions) {
			if (overwrite || !this.definitions.includes(definition)) {
				this.definitions.push(definition);
			}
		}
	}

	defaultDefinitions() {
		return actionDefinitions;
	}
}
