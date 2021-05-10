import { BotTurnOption } from "./BotTurn";

export interface ScoredOption {
	readonly formula: string;
	readonly option: BotTurnOption;
	readonly score: number;
}
