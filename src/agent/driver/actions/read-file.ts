import { BaseDriverAction, type IDriverAction } from "./base-action";
import fs from "node:fs";

export interface IReadFileAction extends IDriverAction {
	readFile(): Promise<boolean>;
}

export class ReadFileAction
	extends BaseDriverAction
	implements IReadFileAction
{
	filename?: string;
	contextLengthLimit = 4000;

	onStartTask() {
		this.log(`${this.taskPrefix}Reading file ${this.filename}`);
	}

	async readFile() {
		if (!this.filename) {
			throw new Error("Read file: Missing file name");
		}
		if (!fs.existsSync(this.filename)) {
			return false;
		}

		const fileData = await fs.promises.readFile(this.filename, {
			encoding: "utf-8",
		});
		const content = this.contentFromFileData(fileData);
		this.setMessage(content);
		return true;
	}

	contentFromFileData(fileData: string) {
		return fileData.substring(0, this.contextLengthLimit);
	}

	handleMissingFile() {
		this.sendMessage("ERROR: That file does not exist");
		return;
	}

	async attemptToReadFile() {
		if (!(await this.shouldReadFile())) {
			return;
		}
		return this.readFile() || this.handleMissingFile();
	}

	handleCannotReadFile() {
		this.sendMessage(
			`ERROR: You are not allowed to read this file: ${this.filename}`,
		);
	}

	public async execute() {
		this.filename = this.fnArgs.filename;
		(await this.attemptToReadFile()) || this.handleCannotReadFile();
	}

	async getInput(msg: string) {
		return await this.driver.getInput(msg);
	}

	get askToReadFileMsg() {
		return `\nGPT: I want to read the file ${this.filename}\nDo you allow this? (y/n): `;
	}

	async shouldReadFile() {
		return this.autopilot || (await this.getInput(this.askToReadFileMsg));
	}
}
