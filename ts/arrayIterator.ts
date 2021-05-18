export function arrayIterator<T>(items: T[]): Iterator<T, undefined, void> {
	let i = 0;
	return {
		next: () => {
			if (i < items.length) {
				const value = items[i++];
				return {
					done: false,
					value,
				} as IteratorYieldResult<T>;
			} else {
				return { done: true } as IteratorReturnResult<undefined>;
			}
		},
	};
}
