import { BotTurnEffect, BotTurnEffectType } from "./BotTurn";

export interface InvestigationCompleteEffect extends BotTurnEffect {
    effectType: BotTurnEffectType.InvestigationComplete;
}
