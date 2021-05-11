export interface ErrorLike {
	message: string;
	name: string;
	stack?: string | undefined;
}

export function isErrorLike(maybe: unknown): maybe is ErrorLike {
	const el = maybe as ErrorLike;
	// noinspection SuspiciousTypeOfGuard
	return (maybe != null)
		&& ((maybe instanceof Error) || (typeof el.name === "string" && typeof el.message === "string"));
}

export function formatThrowable(t: unknown): string {
	if (t == null) {
		return "";
	} else if (isErrorLike(t)) {
		return `[${t.name}] ${t.message}\n${t.stack}\n`;
	} else if (typeof t === "string" || typeof t === "number" || typeof t === "symbol") {
		return String(t);
	} else {
		return JSON.stringify(t);
	}
}
