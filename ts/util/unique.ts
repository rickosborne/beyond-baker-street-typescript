export function unique<T>(items: T[]): T[] {
	const u: T[] = [];
	for (const item of items) {
		if (!u.includes(item)) {
			u.push(item);
		}
	}
	return u;
}

export function uniqueReducer<T>(prev: T[], cur: T): T[] {
	if (!prev.includes(cur)) {
		prev.push(cur);
	}
	return prev;
}
