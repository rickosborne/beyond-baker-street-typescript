import { ActionType } from "./ActionType";
import { addEffectsIfNotPresent } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { EVIDENCE_CARD_VALUES, EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { groupBy } from "./groupBy";
import { invertValues } from "./InvertValues";
import { InvestigateAction } from "./InvestigateAction";
import { LeadType } from "./LeadType";
import { minus } from "./minus";
import { MysteryCard } from "./MysteryCard";
import { objectMap } from "./objectMap";
import { availableValuesByType, playedEvidence } from "./playedEvidence";
import { summingPathsTo } from "./summingPathsTo";
import { TurnStart } from "./TurnStart";
import { VisibleLead } from "./VisibleBoard";
import { unfinishedLeads } from "./unfinishedLeads";

export interface InvestigateOption extends BotTurnOption {
	action: InvestigateAction,
	strategyType: BotTurnStrategyType.Investigate,
}

export function buildEffectsForLeadWithCard(
	lead: VisibleLead,
	mysteryCard: MysteryCard,
	availableEvidenceValues: EvidenceValue[],
): BotTurnEffectType[] {
	const { evidenceType, evidenceTarget } = lead.leadCard;
	const effects: BotTurnEffectType[] = [];
	const { possibleTypes, possibleValues } = mysteryCard;
	const singleType = possibleTypes.length === 1;
	const exactType = singleType && possibleTypes[0] === evidenceType;
	const gap = (evidenceTarget + lead.badValue) - lead.evidenceValue;
	const singleValue = possibleValues.length === 1;
	const exactValue = singleValue && possibleValues[0] === gap;
	const possibleType = exactType || possibleTypes.includes(evidenceType);
	const maybeOver = () => possibleValues.filter(v => v > gap).length > 0;
	const wouldWedge = () => possibleValues.findIndex(v => {
		const gapAfter = gap - v;
		return gapAfter === 0 ? true : (summingPathsTo(gapAfter, minus(availableEvidenceValues, v)) > 0);
	}) < 0;
	if (!possibleType) {
		if (summingPathsTo(gap, availableEvidenceValues) > 0) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateBadOnUnwedged);
		} else if (possibleValues.findIndex(v => summingPathsTo(gap + v, availableEvidenceValues) > 0) >= 0) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateUnwedgeWithBad);
		} else {
			addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateBadOnWedged);
		}
	} else if (wouldWedge()) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateWouldWedge);
	} else if (exactType && exactValue) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigatePerfect);
	} else if (exactValue) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateCorrectValue);
	} else if (maybeOver()) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateMaybeBad);
	} else if (exactType) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateCorrectType);
	} else {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateWild);
	}
	return effects;
}

export function buildOptionForLeadWithCard(
	leadType: LeadType,
	handIndex: number,
	effects: BotTurnEffectType[],
): InvestigateOption {
	return {
		action: {
			actionType: ActionType.Investigate,
			handIndex,
			leadType,
		},
		effects,
		strategyType: BotTurnStrategyType.Investigate,
	};
}

export class InvestigateStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Investigate;

	public buildOptions(turn: TurnStart, bot: Bot): InvestigateOption[] {
		const availableByType = availableValuesByType(turn);
		const options: InvestigateOption[] = [];
		const hand = bot.hand;
		for (const lead of unfinishedLeads(turn)) {
			const evidenceType = lead.leadCard.evidenceType;
			const availableEvidenceValues: EvidenceValue[] = availableByType[evidenceType];
			for (let handIndex = 0; handIndex < hand.length; handIndex++) {
				const mysteryCard = hand[handIndex];
				const effects = buildEffectsForLeadWithCard(lead, mysteryCard, availableEvidenceValues);
				const option = buildOptionForLeadWithCard(lead.leadCard.leadType, handIndex, effects);
				options.push(option);
			}
		}
		return options;
	}
}
