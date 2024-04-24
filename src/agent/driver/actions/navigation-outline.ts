import { navigationOutline } from "./definitions/navigation-outline";
import { ElementAction } from "./element-action";

// determines the page outline in terms of navigation elements, such as navigation menu, anchors etc
export class NavigationOutlineAction extends ElementAction {
	name = "navigation_outline";
	definition = navigationOutline;

	get defaultNavSelector() {
		return "header,footer,nav,aside,.menu,.sidebar,.topmenu,.sidemenu,.leftmenu,.topbar";
	}

	get navSelector() {
		return this.fnArgs.navSelector || this.defaultNavSelector
	}

	getLinkInfoFor(element: HTMLAnchorElement) {
		if (!element.href) {
			return;
		}
		return {
			href: element.href,
			text: element.text,
		};
	}

	async execute() {
		const navs = await this.page?.$$(this.navSelector);
		if (!navs) {
			return;
		}
		const results: any[] = [];
		for (const nav of navs) {
			nav.$$eval("a", async (elements: HTMLAnchorElement[]) => {
				for (const element of elements) {
					const linkInfo = await this.getLinkInfoFor(element);
					results.push(linkInfo);
				}
			});
		}
		const message = JSON.stringify(results);
		this.addToMessage(message);
	}
}
