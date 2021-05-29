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

export type ResettableTimer = Timer & {
	reset(): void;
};

export function resettableTimer(): ResettableTimer {
	let start = Date.now();
	let elapsed: number | undefined;
	function repeatableTimer(): number {
		if (elapsed === undefined) {
			elapsed = Date.now() - start;
		}
		return elapsed;
	}
	function reset(): void {
		start = Date.now();
		elapsed = undefined;
	}
	repeatableTimer.reset = reset;
	return repeatableTimer;
}
