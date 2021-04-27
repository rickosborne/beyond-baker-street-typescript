import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { TurnStart } from "./TurnStart";
import { LEAD_TYPES } from "./LeadType";
import { ConfirmAction } from "./ConfirmAction";
import { ActionType } from "./ActionType";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { WinEffect } from "./WinEffect";
import { LoseEffect } from "./LoseEffect";

export interface ConfirmOption extends BotTurnOption {
	strategyType: BotTurnStrategyType.Confirm;
}

export interface ConfirmEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.Confirm;
}

export class ConfirmStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Confirm;

	public buildOptions(turn: TurnStart): BotTurnOption[] {
		const options: BotTurnOption[] = [];
		for (const leadType of LEAD_TYPES) {
			const lead = turn.board.leads[leadType];
			if (!lead.confirmed && (lead.evidenceValue === lead.badValue + lead.leadCard.evidenceTarget)) {
				const confirmEffect: ConfirmEffect = {
					effectType: BotTurnEffectType.Confirm,
				};
				let winLoseEffect: WinEffect | LoseEffect;
				if (turn.board.investigationMarker === INVESTIGATION_MARKER_GOAL) {
					winLoseEffect = <WinEffect> {
						effectType: BotTurnEffectType.Win,
					};
				} else {
					winLoseEffect = <LoseEffect> {
						effectType: BotTurnEffectType.Lose,
					};
				}
				options.push(<ConfirmOption> {
					action: <ConfirmAction> {
						actionType: ActionType.Confirm,
						leadType,
					},
					effects: [ confirmEffect, winLoseEffect ],
					strategyType: BotTurnStrategyType.Confirm,
				});
			}
		}
		return options;
	}
}
