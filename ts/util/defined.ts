export function isDefined<T>(maybe: T): maybe is NonNullable<T> {
	return maybe !== undefined && maybe !== null;
}
