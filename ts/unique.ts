export function unique<T>(items: T[]): T[] {
	const u: T[] = [];
	for (const item of items) {
		if (!u.includes(item)) {
			u.push(item);
		}
	}
	return u;
}
