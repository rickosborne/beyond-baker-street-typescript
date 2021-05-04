export function findIndexes<T>(items: T[], predicate: (item: T) => boolean): number[] {
	const indexes: number[] = [];
	for (let i = 0; i < items.length; i++) {
		if (predicate(items[i])) {
			indexes.push(i);
		}
	}
	return indexes;
}
