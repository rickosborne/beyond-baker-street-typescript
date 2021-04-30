import { roundTo } from "./roundTo";

export function columnarNumber(num: number, width: number, digits: number): string {
	const rounded = roundTo(num, digits);
	let result = `${rounded}`;
	if (Math.floor(rounded) === rounded) {
		result = `${result}${" ".repeat(digits + 1)}`;
	}
	if (result.length < width) {
		result = `${" ".repeat(width - result.length)}${result}`;
	}
	return result;
}
