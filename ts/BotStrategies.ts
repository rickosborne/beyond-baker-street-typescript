import { BotTurnStrategy } from "./BotTurn";
import { AssistStrategy } from "./AssistStrategy";
import { ConfirmStrategy } from "./ConfirmStrategy";
import { EliminateStrategy } from "./EliminateStrategy";
import { PursueStrategy } from "./PursueStrategy";

export const BOT_STRATEGIES: BotTurnStrategy[] = [
	new AssistStrategy(),
	new ConfirmStrategy(),
	new EliminateStrategy(),
	new PursueStrategy(),
];
