import type { ElementHandle, PuppeteerLifeCycleEvent } from "puppeteer";
import type { IDriverAction } from "./base-action";
import type { DebugOpts } from "../../../types";
import { ElementAction } from "./element-action";

export interface IGotoUrlAction extends IDriverAction {}

export type GotoUrlOpts = DebugOpts & {};
export class GotoUrlAction extends ElementAction implements IGotoUrlAction {
	waitUntil: PuppeteerLifeCycleEvent = "load";
	linksAndInputs?: ElementHandle<Element>[];

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

	protected async getTabbableElements() {
		if (!this.page) {
			throw new Error("Missing page");
		}
		return await this.elementSelector?.getElements(this.page);
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
