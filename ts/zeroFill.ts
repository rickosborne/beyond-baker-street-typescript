export function zeroFill(num: number, width: number): string {
	const rounded = Math.round(num);
	let result = String(rounded);
	const moreZeroes = width - result.length;
	if (moreZeroes > 0) {
		result = `${"0".repeat(moreZeroes)}${result}`;
	}
	return result;
}
