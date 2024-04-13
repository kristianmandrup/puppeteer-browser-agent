export class AgentPlanner {
	async start() {
		let context = [
			{
				role: "system",
				content: `
	## OBJECTIVE ##
	You have been tasked with crawling the internet based on a task given by the user. You are connected to a web browser which you can control via function calls to navigate to pages and list elements on the page. You can also type into search boxes and other input fields and send forms. You can also click links on the page. You will behave as a human browsing the web.

	## NOTES ##
	You will try to navigate directly to the most relevant web address. If you were given a URL, go to it directly. If you encounter a Page Not Found error, try another URL. If multiple URLs don't work, you are probably using an outdated version of the URL scheme of that website. In that case, try navigating to their front page and using their search bar or try navigating to the right place with links.

	## WHEN TASK IS FINISHED ##
	When you have executed all the operations needed for the original task, call answer_user to give a response to the user.`.trim(),
			},
		];

		let message = `Task: ${the_prompt}.`;
		let msg = {
			role: "user",
			content: message,
		};

		let accept_plan = "n";
		let response;

		while (accept_plan !== "y") {
			response = await send_chat_message(msg, context, {
				name: "make_plan",
				arguments: ["plan"],
			});

			let args = JSON.parse(response.function_call.arguments);

			print("\n## PLAN ##");
			print(args.plan);
			print("## PLAN ##\n");

			if (autopilot) {
				accept_plan = "y";
			} else {
				accept_plan = await input(
					"Do you want to continue with this plan? (y/n): ",
				);
			}
		}

		context.push(msg);
		context.push(response);

		if (debug) {
			fs.writeFileSync("context.json", JSON.stringify(context, null, 2));
		}

		const page = await start_browser();
		await do_next_step(page, context, response, [], null);

		browser.close();
	}
}
