export type Logger = (message: string) => void;

export const CONSOLE_LOGGER: Logger = message => console.log(message);
export const SILENT_LOGGER: Logger = () => undefined;
