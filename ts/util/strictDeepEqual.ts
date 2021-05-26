const SCALAR_TYPES = [ "bigint", "boolean", "number", "string", "symbol", "undefined" ];

export function strictDeepEqual(a: unknown, b: unknown): boolean {
	if (a === b) {
		return true;
	}
	const type = typeof a;
	if (type !== typeof b) {
		return false;
	} else if (SCALAR_TYPES.includes(type)) {
		return a === b;
	} else if (type === "function") {
		// Because the linter complains about Function
		return (a as string).toString() === (b as string).toString();
	} else if (type !== "object") {
		/* istanbul ignore next */
		throw new Error(`Unhandled type ${type} in strictDeepEqual`);
	}
	const isArray = Array.isArray(a);
	if (isArray !== Array.isArray(b)) {
		return false;
	} else if (isArray) {
		const arr: unknown[] = a as unknown[];
		const brr: unknown[] = b as unknown[];
		if (arr.length !== brr.length) {
			return false;
		}
		return arr.findIndex((av, i) => !strictDeepEqual(av, brr[i])) < 0;
	}
	const ao = a as Record<string | symbol | number, unknown>;
	const bo = b as Record<string | symbol | number, unknown>;
	const ak = Object.keys(ao).sort();
	const bk = Object.keys(bo).sort();
	if (!strictDeepEqual(ak, bk)) {
		return false;
	}
	return ak.findIndex(k => !strictDeepEqual(ao[k], bo[k])) < 0;
}
