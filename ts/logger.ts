import { objectMap } from "./util/objectMap";

export interface Logger {
	info(messageBuilder: () => string): void;
	json(data: unknown): void;
	trace(messageBuilder: () => string): void;
}

export const CONSOLE_LOGGER: Logger = {
	info: (messageBuilder: () => string) => console.info(messageBuilder()),
	json: (data: unknown) => console.log(JSON.stringify(data)),
	trace: (messageBuilder: () => string) => console.log(messageBuilder()),
};
export const CONSOLE_LOGGER_NO_JSON: Logger = {
	info: (messageBuilder: () => string) => console.info(messageBuilder()),
	json: (data: unknown) => void(0),
	trace: (messageBuilder: () => string) => console.log(messageBuilder()),
};
export const SILENT_LOGGER: Logger = {
	info: () => void (0),
	json: () => void (0),
	trace: () => void (0),
};

export enum LogLevel {
	info = "info",
	json = "json",
	trace = "trace",
}

export interface LogWithLevel {
	level: LogLevel;
	message: string;
	time: number;
}

export type CachingLogger = Logger & {
	readonly messages: LogWithLevel[];
};

// noinspection JSUnusedGlobalSymbols
export function cachingLoggerFactory(levels: Record<LogLevel, boolean>): CachingLogger {
	const messages: LogWithLevel[] = [];
	const log = (level: LogLevel) => (messageBuilder: () => string) => messages.push({
		level,
		message: typeof messageBuilder === "function" ? messageBuilder() : JSON.stringify(messageBuilder),
		time: Date.now(),
	});
	const drop = () => void(0);
	const effective: Record<LogLevel, boolean> = Object.assign({
		[LogLevel.info]: true,
		[LogLevel.json]: true,
		[LogLevel.trace]: true,
	}, levels);
	return Object.assign({ messages }, objectMap(effective, (loud, level) => loud ? log(level) : drop));
}

export function buildLogger(levels: Record<LogLevel, boolean>): Logger {
	const effective: Record<LogLevel, boolean> = Object.assign({
		[LogLevel.info]: true,
		[LogLevel.json]: true,
		[LogLevel.trace]: true,
	}, levels);
	return objectMap(effective, (loud, level) => loud ? CONSOLE_LOGGER[level] : SILENT_LOGGER[level]);
}
