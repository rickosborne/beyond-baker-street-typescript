export function crossProduct<T, U>(t: T[], u: U[]): [ T, U ][] {
	const result: [ T, U ][] = [];
	for (const tItem of t) {
		for (const uItem of u) {
			result.push([ tItem, uItem ]);
		}
	}
	return result;
}
