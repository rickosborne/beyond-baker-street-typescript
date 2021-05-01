import { BotTurnOption } from "./BotTurn";

export interface ScoredOption {
    formula: string;
    option: BotTurnOption;
    score: number;
}
