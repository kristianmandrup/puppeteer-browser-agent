export const readFile = {
	name: "read_file",
	description: "Read the contents of a file that the user has provided to you",
	parameters: {
		type: "object",
		properties: {
			filename: {
				type: "string",
				description: "The filename to read, e.g. file.txt or path/to/file.txt",
			},
		},
	},
	required: ["filename"],
};
