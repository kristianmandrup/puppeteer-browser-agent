import type { FnArgs } from ".";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Context = any[]

export class ClickLinkAction {
	fnArgs: FnArgs = {}
	message = ""
	linkId?: string
	linkText?: string
	userMsg?: string

	context: Context = []

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	constructor(fnArgs: FnArgs, context: any[], linksAndInputs: any[]) {
		this.fnArgs = fnArgs
		this.linkId = fnArgs.pgpt_id;
		this.linkText = fnArgs.text;
		this.context = context	
	}
		
	missingLinkId() {
		if (this.linkId) {
			return
		}
		this.message = "ERROR: Missing parameter pgpt_id";
	}

	missingLinkText() {
		if (this.linkText) {
			return
		}
		this.message = "";
		this.context.pop();
		this.userMsg = "Please the correct link on the page. Remember to set both the text and the pgpt_id parameter."		
	}

	findLink() {
		return this.linksAndInputs.find(
			(elem) => elem && elem.id === this.linkId,
		);
	
	}


	action() {
		const link = this.findLink()
		try {
			print(task_prefix + `Clicking link "${link.text}"`);

			request_count = 0;
			response_count = 0;
			download_started = false;

			if (!page.$(".pgpt-element" + linkId)) {
				throw new Error("Element not found");
			}

			page.click(".pgpt-element" + linkId);

			await wait_for_navigation(page);

			let url = await page.url();

			if (download_started) {
				download_started = false;
				message = "Link clicked and file download started successfully!";
				noContent = true;
			} else {
				message = "Link clicked! You are now on " + url;
			}
		} catch (error) {
			if (debug) {
				print(error);
			}
			if (error instanceof TimeoutError) {
				message = "NOTICE: The click did not cause a navigation.";
			} else {
				let link_text = link ? link.text : "";

				message = `Sorry, but link number ${linkId} (${link_text}) is not clickable, please select another link or another command. You can also try to go to the link URL directly with "goto_url".`;
			}
		}
	}


	execute() {
		this.missingLinkId()
		this.missingLinkText()

		print(task_prefix + "Scraping page...");
		linksAndInputs = await get_tabbable_elements(page);
	}	
}
