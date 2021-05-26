export function removeIf<T>(items: T[], predicate: (item: T) => boolean): number {
	let removedCount = 0;
	for (let i = items.length - 1; i >= 0; i--) {
		if (predicate(items[i])) {
			items.splice(i, 1);
			removedCount++;
		}
	}
	return removedCount;
}
