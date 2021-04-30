export interface Logger {
	info(messageBuilder: () => string): void;
	json(data: unknown): void;
	trace(messageBuilder: () => string): void;
}

export const CONSOLE_LOGGER: Logger = {
	info: (messageBuilder: () => string) => console.info(messageBuilder()),
	json: (data: unknown) => console.log(JSON.stringify(data)),
	trace: (messageBuilder: () => string) => console.trace(messageBuilder()),
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
}

export type CachingLogger = Logger & {
	readonly messages: LogWithLevel[];
};

// noinspection JSUnusedGlobalSymbols
export function cachingLoggerFactory(): CachingLogger {
	const messages: LogWithLevel[] = [];
	const log = (level: LogLevel) => (messageBuilder: () => string) => messages.push({ level, message: messageBuilder() });
	return {
		info: log(LogLevel.info),
		json: log(LogLevel.json),
		messages,
		trace: log(LogLevel.trace),
	};
}
