import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { addEffectsIfNotPresent } from "./addEffect";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategyType } from "./BotTurn";
import { EvidenceCard, formatEvidence, isEvidenceCard } from "./EvidenceCard";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { OncePerGameInspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { LeadType } from "./LeadType";
import { Outcome, OutcomeType } from "./Outcome";
import { Player, PlayerInspector } from "./Player";
import { summingPathsTo } from "./summingPathsTo";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unfinishedLeads";

export interface BaskervilleAction extends Action {
	actionType: ActionType.Baskerville;
	impossibleEvidence: EvidenceCard;
	leadEvidence: EvidenceCard;
	leadType: LeadType;
}

export interface BaskervilleOption extends BotTurnOption {
	action: BaskervilleAction;
	strategyType: BotTurnStrategyType.Inspector;
}

export interface BaskervilleOutcome extends Outcome {
	action: BaskervilleAction;
	activePlayer: PlayerInspector<InspectorType.Baskerville>;
	investigationDelta: number;
	investigationMarker: number;
	outcomeType: OutcomeType.Baskerville;
}

export function isBaskervilleAction(maybe: unknown): maybe is BaskervilleAction {
	return (maybe != null) && ((maybe as BaskervilleAction).actionType === ActionType.Baskerville);
}

export function isBaskervilleOutcome(maybe: unknown): maybe is BaskervilleOutcome {
	return (maybe != null) && ((maybe as BaskervilleOutcome).outcomeType === OutcomeType.Baskerville);
}

export function formatBaskervilleAction(action: BaskervilleAction, player: Player, investigationMarker: number): string {
	return `${player.name} swapped impossible ${formatEvidence(action.impossibleEvidence)} with lead ${formatEvidence(action.leadEvidence)}.  Investigation marker is at ${investigationMarker}.`;
}

export function formatBaskervilleOutcome(outcome: BaskervilleOutcome): string {
	return `${outcome.activePlayer.name} moved the investigation by ${outcome.investigationDelta} by swapped impossible ${formatEvidence(outcome.action.impossibleEvidence)} with lead ${formatEvidence(outcome.action.leadEvidence)}.  Investigation marker is at ${outcome.investigationMarker}.`;
}

export function buildBaskervilleOption(
	impossibleEvidence: EvidenceCard,
	leadType: LeadType,
	leadEvidence: EvidenceCard,
	...effects: BotTurnEffectType[]
): BaskervilleOption {
	return {
		action: {
			actionType: ActionType.Baskerville,
			impossibleEvidence,
			leadEvidence,
			leadType,
		},
		effects,
		strategyType: BotTurnStrategyType.Inspector,
	};
}

export function buildBaskervilleOptionForImpossibleAndLead(
	impossibleEvidence: EvidenceCard,
	leadType: LeadType,
	leadEvidence: EvidenceCard,
	turn: TurnStart,
	leadGap: number,
	evidenceValues: () => number[]
): BaskervilleOption | undefined {
	const leadAdds = impossibleEvidence.evidenceValue - leadEvidence.evidenceValue;
	const investigationAdds = -leadAdds;
	const effects: BotTurnEffectType[] = [];
	const updatedInvestigationMarker = turn.board.investigationMarker + investigationAdds;
	if (updatedInvestigationMarker > INVESTIGATION_MARKER_GOAL || leadAdds > leadGap) {
		// swapping would lose the game, or invalidate the lead
		return undefined;
	} else if (updatedInvestigationMarker === INVESTIGATION_MARKER_GOAL) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigationComplete);
	}
	if (leadAdds === leadGap) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.ConfirmReady);
	} else {
		const remaining = leadGap - leadAdds;
		const values = evidenceValues();
		if (summingPathsTo(remaining, values) > 0) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.ConfirmEventually);
		}
	}
	if (effects.length > 0) {
		return buildBaskervilleOption(impossibleEvidence, leadType, leadEvidence, ...effects);
	}
	return undefined;
}

export class BaskervilleInspectorStrategy extends OncePerGameInspectorStrategy {
	public readonly inspectorType = InspectorType.Baskerville;

	public buildOptions(turn: TurnStart): BotTurnOption[] {
		const options: BotTurnOption[] = [];
		this.ifAvailable(() => {
			const impossibleEvidences = turn.board.impossibleCards.filter(isEvidenceCard);
			if (impossibleEvidences.length === 0 || turn.board.investigationMarker === INVESTIGATION_MARKER_GOAL) {
				return;
			}
			const otherPlayerCards = this.memoizedOtherCards(turn);
			for (const lead of unfinishedLeads(turn)) {
				const leadGap = (lead.badValue + lead.leadCard.evidenceTarget) - lead.evidenceValue;
				const evidenceType = lead.leadCard.evidenceType;
				const evidenceValues = this.memoizedTypedCardValues(otherPlayerCards, evidenceType);
				for (const leadEvidence of lead.evidenceCards) {
					for (const impossibleEvidence of impossibleEvidences) {
						const option = buildBaskervilleOptionForImpossibleAndLead(impossibleEvidence, lead.leadCard.leadType, leadEvidence, turn, leadGap, evidenceValues);
						if (option != null) {
							options.push(option);
						}
					}
				}
			}
		});
		return options;
	}

	sawBaskervilleOutcome(): void {
		this.setUsed();
	}
}
