import { BaseDriverAction } from "./base-action";

export class GotoUrlAction extends BaseDriverAction {
	onStart(url: string) {
		print(`${this.taskPrefix}Going to ${url}`);
	}

	async execute() {
		let url = this.fnArgs.url;
		if (!url) {
			throw new Error("Missing url to go to");
		}
		this.onStart(url);
		try {
			await this.page.goto(url, {
				waitUntil: wait_until,
			});

			url = await page.url();

			message = `You are now on ${url}`;
		} catch (error) {
			message = check_download_error(error);
			message = message ?? "There was an error going to the URL";
		}

		print(task_prefix + "Scraping page...");
		linksAndInputs = await get_tabbable_elements(page);
	}
}
