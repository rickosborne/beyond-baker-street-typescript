import { Action } from "../Action";
import { ActionType } from "../ActionType";
import { addEffectsIfNotPresent } from "../addEffect";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "../BotTurn";
import { EvidenceCard, formatEvidence, isEvidenceCard } from "../EvidenceCard";
import { InspectorStrategy } from "../InspectorStrategy";
import { InspectorType } from "../InspectorType";
import { Outcome, OutcomeType } from "../Outcome";
import { Player, PlayerInspector } from "../Player";
import { summingPathsTo } from "../util/summingPathsTo";
import { TurnStart } from "../TurnStart";
import { unfinishedLeads } from "../unfinishedLeads";

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

export function buildHudsonOptionForLeadAndImpossible(
	impossibleEvidence: EvidenceCard,
	leadGap: number,
	evidenceValues: () => number[],
): HudsonOption | undefined {
	const evidenceValue = impossibleEvidence.evidenceValue;
	const effects: BotTurnEffectType[] = [];
	if (leadGap === evidenceValue) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.ConfirmEventually);
	} else if (leadGap > evidenceValue) {
		const remain = leadGap - evidenceValue;
		const values = evidenceValues();
		if (summingPathsTo(remain, values) > 0) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.ConfirmEventually);
		}
	}
	if (effects.length > 0) {
		return {
			action: {
				actionType: ActionType.Hudson,
				impossibleEvidence,
			},
			effects,
			strategyType: BotTurnStrategyType.Inspector,
		};
	}
	return undefined;
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
				const option = buildHudsonOptionForLeadAndImpossible(impossibleEvidence, leadGap, evidenceValues);
				if (option != null) {
					options.push(option);
				}
			}
		}
		return options;
	}
}
