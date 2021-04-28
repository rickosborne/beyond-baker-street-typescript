import { BotTurnStrategy } from "./BotTurn";
import { AssistStrategy } from "./AssistStrategy";
import { ConfirmStrategy } from "./ConfirmStrategy";
import { EliminateStrategy } from "./EliminateStrategy";
import { PursueStrategy } from "./PursueStrategy";
import { InvestigateStrategy } from "./InvestigateStrategy";

export const BOT_STRATEGIES: BotTurnStrategy[] = [
	new AssistStrategy(),
	new ConfirmStrategy(),
	new EliminateStrategy(),
	new InvestigateStrategy(),
	new PursueStrategy(),
];
