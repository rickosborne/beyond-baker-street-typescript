import { BotTurnOption } from "./BotTurn";

export interface ScoredOption {
	readonly option: BotTurnOption;
	readonly score: number;
}
