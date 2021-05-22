/**
 * @return {number} y matching x
 */
export function interpolate(
	x1: number,
	x2: number,
	y1: number,
	y2: number,
	x: number
): number {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const p = (x - x1) / dx;
	return y1 + (dy * p);
}
