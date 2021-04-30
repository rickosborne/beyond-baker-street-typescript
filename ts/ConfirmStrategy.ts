import { ActionType } from "./ActionType";
import { addEffect } from "./addEffect";
import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { ConfirmAction } from "./ConfirmAction";
import { HOLMES_MOVE_CONFIRM, INVESTIGATION_MARKER_GOAL } from "./Game";
import { HolmesImpededEffect } from "./HolmesProgressEffect";
import { LEAD_TYPES } from "./LeadType";
import { addLoseEffect } from "./LoseEffect";
import { TurnStart } from "./TurnStart";
import { addWinEffect } from "./WinEffect";

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
				const effects: BotTurnEffect[] = [];
				addEffect<ConfirmEffect>(effects, {
					effectType: BotTurnEffectType.Confirm,
				});
				addEffect<HolmesImpededEffect>(effects, {
					delta: HOLMES_MOVE_CONFIRM,
					effectType: BotTurnEffectType.HolmesImpeded,
				});
				if (turn.board.investigationMarker === INVESTIGATION_MARKER_GOAL) {
					addWinEffect(effects);
				} else {
					addLoseEffect(effects);
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
