import type { PuppeteerLifeCycleEvent } from "puppeteer";
import { BaseDriverAction } from "./base-action";

export class GotoUrlAction extends BaseDriverAction {
	waitUntil: PuppeteerLifeCycleEvent = "load";
	linksAndInputs: any[] = [];

	onStart(url: string) {
		this.log(`${this.taskPrefix}Going to ${url}`);
	}

	async execute() {
		let url = this.fnArgs.url;
		if (!url) {
			throw new Error("Missing url to go to");
		}
		this.onStart(url);
		const { waitUntil } = this;
		if (!this.page) {
			throw new Error("Missing page");
		}
		try {
			await this.page?.goto(url, {
				waitUntil,
			});
			url = await this.page?.url();

			this.setMessage(`You are now on ${url}`);
		} catch (error) {
			const errMessage =
				this.downloadError(error) || this.defaultGotoErrorMessage;
			this.setMessage(errMessage);
		}
		this.onStartScraping();
		this.linksAndInputs = await this.getTabbableElements();
	}

	onStartScraping() {
		this.log(`${this.taskPrefix}Scraping page...`);
	}

	get defaultGotoErrorMessage() {
		return "There was an error going to the URL";
	}

	// TODO
	// biome-ignore lint/suspicious/useAwait: <explanation>
	async getTabbableElements() {
		return [];
	}

	downloadError(error: unknown): string | undefined {
		if (
			error instanceof Error &&
			error.message.startsWith("net::ERR_ABORTED")
		) {
			return "NOTICE: The connection was aborted. If you clicked on a download link, the file has been downloaded to the default Chrome downloads location.";
		}
		this.log(error);
		return;
	}
}
