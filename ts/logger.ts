export interface Logger {
	info(message: string): void;
	json(data: unknown): void;
	trace(message: string): void;
}

export const CONSOLE_LOGGER: Logger = Object.assign({
	json: (data: unknown) => console.log(data),
}, console);
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

export function cachingLoggerFactory(): CachingLogger {
	const messages: LogWithLevel[] = [];
	const log = (level: LogLevel) => (message: string) => messages.push({ level, message });
	return {
		info: log(LogLevel.info),
		json: log(LogLevel.json),
		messages,
		trace: log(LogLevel.trace),
	};
}
