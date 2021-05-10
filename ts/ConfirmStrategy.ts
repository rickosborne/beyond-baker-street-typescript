import { ActionType } from "./ActionType";
import { addEffect } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { ConfirmAction } from "./ConfirmAction";
import { HOLMES_MOVE_IMPEDE, HOLMES_MOVE_IMPEDE_BAYNES, INVESTIGATION_MARKER_GOAL } from "./Game";
import { HolmesImpededEffect } from "./HolmesProgressEffect";
import { InspectorType } from "./InspectorType";
import { LEAD_TYPES } from "./LeadType";
import { addLoseEffect } from "./LoseEffect";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";
import { addWinEffect } from "./WinEffect";

export interface ConfirmOption extends BotTurnOption {
	strategyType: BotTurnStrategyType.Confirm;
}

export interface ConfirmEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.Confirm;
}

export interface ConfirmReadyEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.ConfirmReady;
}

export interface ConfirmEventuallyEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.ConfirmEventually;
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
				const effects: BotTurnEffect[] = [];
				const delta = bot.inspector === InspectorType.Baynes ? HOLMES_MOVE_IMPEDE_BAYNES : HOLMES_MOVE_IMPEDE;
				addEffect<ConfirmEffect>(effects, {
					effectType: BotTurnEffectType.Confirm,
				});
				addEffect<HolmesImpededEffect>(effects, {
					delta,
					effectType: BotTurnEffectType.HolmesImpeded,
					inspector: undefined,
				});
				if (bot.inspector === InspectorType.Baynes) {
					// add it a second time, for twice the impact!
					addEffect<HolmesImpededEffect>(effects, {
						delta,
						effectType: BotTurnEffectType.HolmesImpeded,
						inspector: bot.inspector,
					}, true);
				}
				if (unfinished.length === 1) {
					if (turn.board.investigationMarker === INVESTIGATION_MARKER_GOAL) {
						addWinEffect(effects);
					} else {
						addLoseEffect(effects);
					}
				}
				options.push(<ConfirmOption> {
					action: <ConfirmAction> {
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
