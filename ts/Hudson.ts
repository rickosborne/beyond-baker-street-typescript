import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { addEffect } from "./addEffect";
import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "./BotTurn";
import { ConfirmEventuallyEffect } from "./ConfirmStrategy";
import { EvidenceCard, formatEvidence, isEvidenceCard } from "./EvidenceCard";
import { InspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { Outcome, OutcomeType } from "./Outcome";
import { Player, PlayerInspector } from "./Player";
import { summingPathsTo } from "./summingPathsTo";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";

export interface HudsonAction extends Action {
	actionType: ActionType.Hudson;
	impossibleEvidence: EvidenceCard;
}

export interface HudsonOption extends BotTurnOption {
	action: HudsonAction;
	strategyType: BotTurnStrategyType.Inspector;
}

export interface HudsonOutcome extends Outcome {
	action: HudsonAction;
	activePlayer: PlayerInspector<InspectorType.Hudson>;
	investigationMarker: number;
	outcomeType: OutcomeType.Hudson;
}

export function isHudsonAction(maybe: unknown): maybe is HudsonAction {
	return (maybe != null) && ((maybe as HudsonAction).actionType === ActionType.Hudson);
}

export function isHudsonOutcome(maybe: unknown): maybe is HudsonOutcome {
	return (maybe != null) && ((maybe as HudsonOutcome).outcomeType === OutcomeType.Hudson);
}

export function formatHudsonAction(action: HudsonAction, player: Player, investigationMarker: number): string {
	return `${player.name} returned impossible ${formatEvidence(action.impossibleEvidence)}.  Investigation is at ${investigationMarker}.`;
}

export function formatHudsonOutcome(outcome: HudsonOutcome): string {
	return formatHudsonAction(outcome.action, outcome.activePlayer, outcome.investigationMarker);
}

export class HudsonInspectorStrategy extends InspectorStrategy {
	public readonly inspectorType = InspectorType.Hudson;

	public buildOptions(turn: TurnStart): HudsonOption[] {
		const options: HudsonOption[] = [];
		const impossibleEvidences = turn.board.impossibleCards.filter(isEvidenceCard);
		const otherCards = this.memoizedOtherCards(turn);
		for (const lead of unfinishedLeads(turn)) {
			const leadGap = (lead.badValue + lead.leadCard.evidenceTarget) - lead.evidenceValue;
			const evidenceType = lead.leadCard.evidenceType;
			const evidenceValues = this.memoizedTypedCardValues(otherCards, evidenceType);
			for (const impossibleEvidence of impossibleEvidences) {
				if (impossibleEvidence.evidenceType !== evidenceType) {
					continue;
				}
				const evidenceValue = impossibleEvidence.evidenceValue;
				const effects: BotTurnEffect[] = [];
				if (leadGap === evidenceValue) {
					addEffect<ConfirmEventuallyEffect>(effects, {
						effectType: BotTurnEffectType.ConfirmEventually,
					});
				} else if (leadGap > evidenceValue) {
					const remain = leadGap - evidenceValue;
					const values = evidenceValues();
					if (summingPathsTo(remain, values) > 0) {
						addEffect<ConfirmEventuallyEffect>(effects, {
							effectType: BotTurnEffectType.ConfirmEventually,
						});
					}
				}
				if (effects.length > 0) {
					options.push({
						action: {
							actionType: ActionType.Hudson,
							impossibleEvidence,
						},
						effects,
						strategyType: BotTurnStrategyType.Inspector,
					});
				}
			}
		}
		return options;
	}
}
