import type { Page, PuppeteerLifeCycleEvent } from "puppeteer";

export class PageNavigator {
	navigationTimeout = 6000;
	waitUntil: PuppeteerLifeCycleEvent = "load"; // puppeteer lifecycle event

	async waitForNavigation(page: Page) {
		try {
			const { navigationTimeout, waitUntil } = this;

			await page.waitForNavigation({
				timeout: navigationTimeout,
				waitUntil,
			});
		} catch (error) {
			this.onError(error);
		}
	}

	// TODO: inherit
	log(_msg: string) {
		// TODO
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	onError(_error: any) {
		this.log("NOTICE: Giving up on waiting for navigation");
	}
}
