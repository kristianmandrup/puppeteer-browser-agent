import type { Page, PuppeteerLifeCycleEvent } from "puppeteer";
import type { IAgentDriver } from "../agent-driver";
import type { DebugOpts } from "../../../types";

export interface IPageNavigator {
	waitForNavigation(page: Page): Promise<void>;
}

export type PageNavigatorOpts = DebugOpts & {
	navigationTimeout?: number;
};

export class PageNavigator implements IPageNavigator {
	navigationTimeout = 6000;
	waitUntil: PuppeteerLifeCycleEvent = "load"; // puppeteer lifecycle event
	debug: boolean;
	driver: IAgentDriver;
	opts: PageNavigatorOpts;

	constructor(driver: IAgentDriver, opts: PageNavigatorOpts = {}) {
		this.driver = driver;
		this.navigationTimeout =
			opts.navigationTimeout || this.defaults.navigationTimeout;
		this.opts = opts;
		this.debug = Boolean(opts.debug);
	}

	get defaults() {
		return {
			navigationTimeout: 6000,
		};
	}

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

	log(msg: string) {
		this.driver.log(msg);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	onError(_error: any) {
		this.log("NOTICE: Giving up on waiting for navigation");
	}
}
