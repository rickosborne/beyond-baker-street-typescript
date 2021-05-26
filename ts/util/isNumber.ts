export function isNumber(maybe: unknown): maybe is number {
    return (typeof maybe === "number")
			&& !isNaN(maybe)
			&& (maybe !== Infinity)
			&& (maybe !== -Infinity);
}
