import { addEffect } from "./addEffect";
import { BotTurnEffect, BotTurnEffectType } from "./BotTurn";
import { HOLMES_MOVE_IMPOSSIBLE } from "./Game";
import { addHolmesProgressEffects } from "./HolmesProgressEffect";
import { TurnStart } from "./TurnStart";

export interface ImpossibleAddedEffect extends BotTurnEffect {
    effectType: BotTurnEffectType.ImpossibleAdded;
}

export function addImpossibleAddedEffects(
	effects: BotTurnEffect[],
	impossibleCount: number,
	impossibleLimit: number,
	holmesLocation: number,
): void {
	addEffect<ImpossibleAddedEffect>(effects, {
		effectType: BotTurnEffectType.ImpossibleAdded,
	});
	if (impossibleCount + 1 > impossibleLimit) {
		addHolmesProgressEffects(effects, HOLMES_MOVE_IMPOSSIBLE, holmesLocation);
	}
}

export function addImpossibleAddedEffectsFromTurn(
	effects: BotTurnEffect[],
	turn: TurnStart,
): void {
	addImpossibleAddedEffects(effects, turn.board.impossibleCards.length, turn.board.caseFile.impossibleCount, turn.board.holmesLocation);
}
