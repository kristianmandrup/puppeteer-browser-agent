import { makePlan } from "./make-plan";
import { readFile } from "./read-file";
import { gotoUrl } from "./goto-url";
import { enterData } from "./enter-data";
import { takeScreenshot } from "./take-screenshot";
import { communicate } from "./communicate";
import { search } from "./search";
import { findCode } from "./find-code";
import { sectionOutline } from "./section-outline";
import { navigationOutline } from "./navigation-outline";

export const actionDefinitions = [
	makePlan,
	readFile,
	gotoUrl,
	enterData,
	takeScreenshot,
	communicate,
	search,
	findCode,
	sectionOutline,
	navigationOutline,
];
