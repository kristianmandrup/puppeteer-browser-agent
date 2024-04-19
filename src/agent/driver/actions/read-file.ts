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
	skipFile = false;
	name = "read_file";

	onStartTask() {
		this.logTask(`Reading file ${this.filename}`);
	}

	async readFile() {
		if (!this.filename) {
			throw new Error("Read file: Missing file name");
		}
		if (!fs.existsSync(this.filename)) {
			throw new Error(`File to read ${this.filename} does not exist`);
		}

		const fileData = await this.getFileData();
		const content = this.contentFromFileData(fileData);
		this.setMessage(content);
		return true;
	}

	async getFileData() {
		if (!this.filename) {
			throw new Error("Read file: Missing file name");
		}
		return await fs.promises.readFile(this.filename, {
			encoding: "utf-8",
		});
	}

	contentFromFileData(fileData: string) {
		return fileData.substring(0, this.contextLengthLimit);
	}

	handleReadError(_error: any) {
		this.setMessage(`ERROR: The file ${this.filename} does not exist`);
		return;
	}

	async attemptToReadFile() {
		if (!(await this.shouldReadFile())) {
			this.skipFile = true;
		}
		try {
			this.readFile();
		} catch (error) {
			this.handleReadError(error);
		}
	}

	handleCannotReadFile() {
		if (!this.skipFile) {
			return;
		}
		this.setMessage(
			`ERROR: You are not allowed to read this file: ${this.filename}`,
		);
	}

	public async execute() {
		this.filename = this.fnArgs.filename;
		await this.attemptToReadFile();
		this.handleCannotReadFile();
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
