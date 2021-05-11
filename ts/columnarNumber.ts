import { roundTo } from "./roundTo";

export function columnarNumber(num: number, width: number, digits: number, padding = " "): string {
	const rounded = roundTo(num, digits);
	const [ whole, decimalMaybe ] = String(rounded).split(".");
	const decimal = decimalMaybe || "";
	const wholeSpace = (width - 1) - digits;
	const lPad = " ".repeat(wholeSpace - whole.length);
	const dot = decimal === "" ? " " : ".";
	const rPad = padding.repeat(digits - decimal.length);
	return `${lPad}${whole}${dot}${decimal}${rPad}`;
}
