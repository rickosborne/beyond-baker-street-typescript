export type Timer = () => number;

export function msTimer(): Timer {
	const start = Date.now();
	let elapsed: number | undefined;
	return function msTimer(): number {
		if (elapsed === undefined) {
			elapsed = Date.now() - start;
		}
		return elapsed;
	};
}
