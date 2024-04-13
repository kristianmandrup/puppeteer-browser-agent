import { BaseDriverAction } from "./base-action";

export class ReadFileAction extends BaseDriverAction {
	async getInput(msg: string) {
		return await this.driver.getInput(msg);
	}

	get askToReadFileMsg() {
		return `\nGPT: I want to read the file ${this.filename}\nDo you allow this? (y/n): `;
	}

	async shouldReadFile() {
		return this.autopilot || (await this.getInput(this.askToReadFileMsg));
	}

	async execute() {
		this.filename = this.fnArgs.filename;
		if (await this.shouldReadFile()) {
			print();
			print(task_prefix + "Reading file " + filename);

			if (fs.existsSync(filename)) {
				let file_data = fs.readFileSync(filename, "utf-8");
				file_data = file_data.substring(0, context_length_limit);
				message = file_data;
			} else {
				message = "ERROR: That file does not exist";
			}
		} else {
			print();
			message = "ERROR: You are not allowed to read this file";
		}
	}
}
