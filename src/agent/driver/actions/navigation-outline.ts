import { ElementAction } from "./element-action";

// returns the page outline in terms of navigation elements, such as navigation menu, anchors etc
export class NavigationOutlineAction extends ElementAction {
	name = "navigation_outline";
}