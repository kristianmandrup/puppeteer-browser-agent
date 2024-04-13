import puppeteer from "puppeteer";
import type {
	Viewport,
	Page,
	HTTPRequest,
	HTTPResponse,
	Frame,
	Browser,
} from "puppeteer";

type PageHeaders = Record<string, string>;

type ViewportOpts = {
	width?: number;
	height?: number;
	scaleFactor?: number;
};

type BrowserOpts = {
	debug?: boolean;
	headless?: boolean;
	viewport?: ViewportOpts;
};

export class AgentBrowser {
	page?: Page;
	launched = false;
	loaded = false;
	debug = false;
	headless = false;
	downloadStarted = false;
	responses = 0;
	requests = 0;
	view: ViewportOpts = {};
	browser?: Browser;

	constructor(opts: BrowserOpts = {}) {
		this.debug = Boolean(opts.debug);
		this.headless = Boolean(opts.headless);
		this.view = opts.viewport || {};
	}

	async launch() {
		if (this.launched) {
			return;
		}

		this.browser = await puppeteer.launch({
			headless: this.headless ? "shell" : false,
		});

		this.page = await this.browser.newPage();

		await this.page.setViewport(this.viewport);
		this.launched = true;
	}

	protected get defaultViewport() {
		return {
			width: 1200,
			height: 1200,
			deviceScaleFactor: 1,
		};
	}

	get viewport(): Viewport {
		return {
			...this.defaultViewport,
			...this.view,
		};
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	print(...msgs: any[]) {
		// biome-ignore lint/style/useBlockStatements: <explanation>
		if (!this.debug) return;
		console.info(...msgs);
	}

	close() {
		if (!this.browser) {
			return;
		}
		this.browser.close();
	}

	async start() {
		await this.launch();
		if (!this.page) {
			throw new Error("Browser must be launched before it can be started");
		}
		const page = this.page;
		page.on("request", (request: HTTPRequest) => {
			this.onRequestBlock(request);
			this.incRequestCount();
		});

		page.on("load", () => {
			this.loaded = true;
		});

		page.on("framenavigated", async (frame: Frame) => {
			if (frame === page.mainFrame()) {
				if (frame.childFrames.length < 5) {
					if (this.loaded) {
						this.print("Loading page...");
					}
					this.loaded = false;
				} else {
					await this.sleep(500);
				}
			}
		});

		page.on("response", async (response: HTTPResponse) => {
			this.incResponseCount();

			if (this.isLargeResponse(response)) {
				setTimeout(() => {
					if (this.responses === 1) {
						this.print("DOWNLOAD: A file download has been detected");
						this.startDownload();
					}
				}, 2000);
			}
		});

		return page;
	}

	isBlock(_request: HTTPRequest) {
		return false;
	}

	onRequestBlock(request: HTTPRequest) {
		if (!this.isBlock(request)) {
			return;
		}
		if (request.isNavigationRequest()) {
			request.respond({
				status: 200,
				contentType: "application/octet-stream",
				body: "Dummy file to block navigation",
			});
		} else {
			request.continue();
		}
	}

	incRequestCount() {
		this.requests++;
	}

	startDownload() {
		this.downloadStarted = true;
	}

	isLargeResponse(response: HTTPResponse): boolean {
		const headers = response.headers();
		return (
			this.hasAttachment(headers) ||
			this.hasLargeContent(headers) ||
			this.isBinary(headers)
		);
	}

	isBinary(headers: PageHeaders): boolean {
		return headers["content-type"] === "application/octet-stream";
	}

	hasAttachment(headers: PageHeaders): boolean {
		return Boolean(headers["content-disposition"]?.includes("attachment"));
	}

	hasLargeContent(headers: PageHeaders): boolean {
		return Number(headers["content-length"]) > 1024 * this.maxMbs;
	}

	get maxMbs() {
		return 200;
	}

	incResponseCount() {
		this.responses++;
	}

	async sleep(ms: number, debug = true) {
		if (this.debug && debug) {
			this.print(`Sleeping ${ms} ms`);
		}
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}