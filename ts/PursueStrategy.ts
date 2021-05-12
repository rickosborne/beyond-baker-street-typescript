import { ActionType } from "./ActionType";
import { addEffectsIfNotPresent } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { CardType } from "./CardType";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { addImpossibleAddedEffectsFromTurn } from "./ImpossibleAdded";
import { InspectorType } from "./InspectorType";
import { LEAD_TYPES, LeadType } from "./LeadType";
import { MysteryCard } from "./MysteryCard";
import { availableValuesOfType } from "./playedEvidence";
import { PursueAction } from "./PursueAction";
import { MAX_POSSIBLE_EVIDENCE_VALUE, summingPathsTo } from "./summingPathsTo";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";
import { VisibleLead } from "./VisibleBoard";

export interface PursueOption extends BotTurnOption {
	action: PursueAction;
	strategyType: BotTurnStrategyType.Pursue;
}

export function buildPursueOption(
	leadType: LeadType,
	effects: BotTurnEffectType[],
): PursueOption {
	return {
		action: {
			actionType: ActionType.Pursue,
			leadType,
		},
		effects,
		strategyType: BotTurnStrategyType.Pursue,
	};
}

export function buildPursueEffectsForLead(
	lead: VisibleLead,
	allLeads: VisibleLead[],
	turn: TurnStart,
	botHand: MysteryCard[],
	botInspector?: InspectorType | undefined,
): BotTurnEffectType[] {
	const { evidenceTarget, evidenceType } = lead.leadCard;
	const totalValue = lead.badValue + evidenceTarget;
	const gap = totalValue - lead.evidenceValue;
	const effects: BotTurnEffectType[] = [];
	const possibleBasedOnOtherPlayers = () => summingPathsTo(gap, turn.otherPlayers.flatMap(op => gatherEvidenceFromCards(evidenceType, op.hand))) > 0;
	const maybeBasedOnAvailable = () => summingPathsTo(gap, availableValuesOfType(evidenceType, turn)) > 0;
	addImpossibleAddedEffectsFromTurn(effects, turn, CardType.Lead, BotTurnStrategyType.Pursue, botInspector);
	if (lead.leadCount === 1) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.Lose);
	}
	const otherLeads = allLeads.filter(l => l !== lead);
	if (lead.evidenceCards.length === 0 && otherLeads.find(l => l.leadCard.evidenceType === evidenceType) != null) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.PursueDuplicate);
	}
	if (gap < 1) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.PursueConfirmable);
	} else if (totalValue > MAX_POSSIBLE_EVIDENCE_VALUE) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.PursueImpossible);
	} else if (possibleBasedOnOtherPlayers()) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.PursuePossible);
	} else if (maybeBasedOnAvailable()) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.PursueMaybe);
	} else {
		addEffectsIfNotPresent(effects, BotTurnEffectType.PursueImpossible);
	}
	return effects;
}

export function gatherEvidenceFromCards(
	evidenceType: EvidenceType,
	cards: EvidenceCard[],
): EvidenceValue[] {
	return cards
		.filter(card => card.evidenceType === evidenceType)
		.map(card => card.evidenceValue);
}

export class PursueStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Pursue;

	public buildOptions(turn: TurnStart, bot: Bot): PursueOption[] {
		const visibleLeads = unfinishedLeads(turn);
		return LEAD_TYPES
			.map(leadType => turn.board.leads[leadType])
			.map(lead => buildPursueOption(lead.leadCard.leadType, buildPursueEffectsForLead(lead, visibleLeads, turn, bot.hand, bot.inspector)))
			.filter(option => option != null && option.effects.length > 0) as PursueOption[]
			;
	}
}
