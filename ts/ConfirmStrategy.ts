import { ActionType } from "./ActionType";
import { addEffectsEvenIfDuplicate, addEffectsIfNotPresent } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { ConfirmAction } from "./ConfirmAction";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { InspectorType } from "./InspectorType";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";

export interface ConfirmOption extends BotTurnOption {
	strategyType: BotTurnStrategyType.Confirm;
}

export function isConfirmOption(maybe: unknown): maybe is ConfirmOption {
	return (maybe != null) && ((maybe as ConfirmOption).strategyType === BotTurnStrategyType.Confirm);
}

export class ConfirmStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Confirm;

	public buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[] {
		const options: BotTurnOption[] = [];
		const unfinished = unfinishedLeads(turn);
		for (const lead of unfinished) {
			const leadType = lead.leadCard.leadType;
			const wantValues: number[] = [lead.badValue + lead.leadCard.evidenceTarget];
			if (bot.inspector === InspectorType.Morstan) {
				wantValues.push(wantValues[0] - 1);
			}
			if (wantValues.includes(lead.evidenceValue)) {
				const effects: BotTurnEffectType[] = [];
				addEffectsIfNotPresent(effects, BotTurnEffectType.Confirm);
				addEffectsIfNotPresent(effects, BotTurnEffectType.HolmesImpeded);
				if (bot.inspector === InspectorType.Baynes) {
					// add it a second time, for twice the impact!
					addEffectsEvenIfDuplicate(effects, BotTurnEffectType.HolmesImpeded);
				}
				if (unfinished.length === 1) {
					if (turn.board.investigationMarker === INVESTIGATION_MARKER_GOAL) {
						addEffectsIfNotPresent(effects, BotTurnEffectType.Win);
					} else {
						addEffectsIfNotPresent(effects, BotTurnEffectType.Lose);
					}
				}
				options.push(<ConfirmOption>{
					action: <ConfirmAction>{
						actionType: ActionType.Confirm,
						leadType,
					},
					effects,
					strategyType: BotTurnStrategyType.Confirm,
				});
			}
		}
		return options;
	}
}
