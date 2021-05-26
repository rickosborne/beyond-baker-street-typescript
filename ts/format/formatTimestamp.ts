import { zeroFill } from "../util/zeroFill";

export function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	return `${zeroFill(date.getHours(), 2)}:${zeroFill(date.getMinutes(), 2)}:${zeroFill(date.getSeconds(), 2)}.${zeroFill(date.getMilliseconds(), 4)}`;
}
