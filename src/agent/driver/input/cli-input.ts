export type IQuestionFn = (text: string) => Promise<string>;

export interface ITerminalReader {
	question: IQuestionFn;
}

export type ICreateTerminalReader = () => ITerminalReader;

export class TerminalInputController {
	createReader: ICreateTerminalReader;

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	constructor(createReader: any) {
		this.createReader = createReader;
	}

	// const reader = readline.createInterface({
	// 	input: process.stdin,
	// 	output: process.stdout,
	// });
	// return new Promise((resolve) => {
	// 		rl.question(text, (prompt: string) => {
	// 			rl.close();
	// 			resolve(prompt);
	// 		});
	// 	});

	async execute(text: string) {
		const reader: ITerminalReader = this.createReader();
		return await reader.question(text);
	}
}
