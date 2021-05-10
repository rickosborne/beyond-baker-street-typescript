import { roundTo } from "./roundTo";

export function columnarNumber(num: number, width: number, digits: number, padding = " "): string {
	const rounded = roundTo(num, digits);
	let result = `${rounded}`;
	if (Math.floor(rounded) === rounded) {
		result = `${result}${padding.repeat(digits + 1)}`;
	}
	if (result.length < width) {
		result = `${" ".repeat(width - result.length)}${result}`;
	}
	return result;
}

export function zeroFill(num: number, width: number): string {
	const rounded = Math.round(num);
	let result = String(rounded);
	const moreZeroes = width - result.length;
	if (moreZeroes > 0) {
		result = `${"0".repeat(moreZeroes)}${result}`;
	}
	return result;
}
