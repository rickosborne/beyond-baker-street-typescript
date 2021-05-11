import { roundTo } from "./roundTo";

export function formatDecimal(value: number | undefined, decimals = 1, zeroFill = false): string {
	if (value === undefined) {
		return "";
	}
	const rounded = roundTo(value, decimals);
	const [ whole, fracOrUndef ] = String(rounded).split(".");
	let frac = fracOrUndef === undefined ? "" : fracOrUndef;
	if (zeroFill && frac.length < decimals) {
		frac = `${frac}${"0".repeat(decimals - frac.length)}`;
	}
	return `${whole}${frac !== "" ? "." : ""}${frac}`;
}
