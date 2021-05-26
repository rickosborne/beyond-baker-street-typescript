import { ActionType } from "./ActionType";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { EvidenceValue } from "./EvidenceValue";
import { groupBy } from "./util/groupBy";
import { InvestigateAction } from "./InvestigateAction";
import { LeadType } from "./LeadType";
import { minus } from "./util/minus";
import { MysteryCard } from "./MysteryCard";
import { objectMap } from "./util/objectMap";
import { availableValuesByType } from "./playedEvidence";
import { CompareResult, reduceOptionsComparingOptions } from "./util/reduceOptions";
import { MAX_POSSIBLE_EVIDENCE_VALUE, summingPathsTo } from "./util/summingPathsTo";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unfinishedLeads";
import { VisibleLead } from "./VisibleBoard";

export interface InvestigateOption extends BotTurnOption {
	action: InvestigateAction;
	mysteryCard: MysteryCard;
	strategyType: BotTurnStrategyType.Investigate;
}

export function buildInvestigateEffectsForLeadWithCard(
	lead: VisibleLead,
	mysteryCard: MysteryCard,
	availableEvidenceValues: EvidenceValue[],
	visibleValues: EvidenceValue[],
): BotTurnEffectType[] {
	const evidenceCards = mysteryCard.asArray();
	const { evidenceType, evidenceTarget } = lead.leadCard;
	const targetPlusBad = evidenceTarget + lead.badValue;
	const gap = targetPlusBad - lead.evidenceValue;
	const effects: BotTurnEffectType[] = [];
	for (const evidenceCard of evidenceCards) {
		effects.push(BotTurnEffectType.InvestigatePossibility);
		const evidenceValue = evidenceCard.evidenceValue;
		if (evidenceCard.evidenceType === evidenceType) {
			const remain = gap - evidenceValue;
			if (remain < 0) {
				effects.push(BotTurnEffectType.InvestigateTooFar);
			} else if (remain === 0) {
				effects.push(BotTurnEffectType.InvestigateGoodMakesConfirmable);
			} else {
				const solvableByVisible = summingPathsTo(remain, minus(visibleValues, evidenceValue)) > 0;
				const solvableByAvailable = summingPathsTo(remain, minus(availableEvidenceValues, evidenceValue)) > 0;
				if (solvableByVisible) {
					effects.push(BotTurnEffectType.InvestigateGoodAndVisible);
				} else if (solvableByAvailable) {
					effects.push(BotTurnEffectType.InvestigateGoodAndAvailable);
				} else {
					effects.push(BotTurnEffectType.InvestigateGoodButWouldWedge);
				}
			}
		} else {
			const leadIsWedged = (gap > 0) && (summingPathsTo(gap, availableEvidenceValues) === 0);
			const gapWithBad = gap + evidenceValue;
			const targetPlusThisBad = targetPlusBad + evidenceValue;
			const solvableWithBadByVisible = summingPathsTo(gapWithBad, visibleValues) > 0;
			const solvableWithBadByAvailable = summingPathsTo(gapWithBad, availableEvidenceValues) > 0;
			if (gap === 0) {
				effects.push(BotTurnEffectType.InvestigateBreaksConfirmable);
			}
			if (targetPlusThisBad > MAX_POSSIBLE_EVIDENCE_VALUE) {
				effects.push(BotTurnEffectType.InvestigateTooMuchBad);
			}
			if (leadIsWedged) {
				if (solvableWithBadByVisible) {
					effects.push(BotTurnEffectType.InvestigateUnwedgeForVisible);
				} else if (solvableWithBadByAvailable) {
					effects.push(BotTurnEffectType.InvestigateUnwedgeForAvailable);
				} else {
					effects.push(BotTurnEffectType.InvestigateBadOnWedged);
				}
			} else {  // not already wedged
				if (solvableWithBadByVisible) {
					effects.push(BotTurnEffectType.InvestigateBadButVisible);
				} else if (solvableWithBadByAvailable) {
					effects.push(BotTurnEffectType.InvestigateBadButAvailable);
				} else {
					effects.push(BotTurnEffectType.InvestigateBadOnUnwedgedDoesWedge);
				}
			}
		}
	}
	if (mysteryCard.assistedType != null) {
		effects.push(BotTurnEffectType.InvAssistedType);
	}
	if (mysteryCard.assistedValue != null) {
		effects.push(BotTurnEffectType.InvAssistedValue);
	}
	return effects;
}

/*
export function buildInvestigateEffectsForLeadWithCard(
	lead: VisibleLead,
	mysteryCard: MysteryCard,
	availableEvidenceValues: EvidenceValue[],
	visibleValues: EvidenceValue[],
): BotTurnEffectType[] {
	const { evidenceType, evidenceTarget } = lead.leadCard;
	const effects: BotTurnEffectType[] = [];
	const { possibleTypes, possibleValues } = mysteryCard;
	const singleType = possibleTypes.length === 1;
	const exactType = singleType && possibleTypes[0] === evidenceType;
	const gap = (evidenceTarget + lead.badValue) - lead.evidenceValue;
	const singleValue = possibleValues.length === 1;
	const knownValue = possibleValues.length === 1 ? possibleValues[0] : undefined;
	const exactValue = singleValue && knownValue === gap;
	const possibleType = exactType || possibleTypes.includes(evidenceType);
	const wedged = gap !== 0 && summingPathsTo(gap, availableEvidenceValues) === 0;
	const maybeOver = possibleValues.filter(v => v > gap).length > 0;
	const wouldWedge = possibleValues.findIndex(v => {
		const gapAfter = gap - v;
		return gapAfter === 0 ? true : (summingPathsTo(gapAfter, minus(availableEvidenceValues, v)) > 0);
	}) < 0;
	if (!possibleType) {
		let allPossibleAreSolvableWithVisible = true;
		let allPossibleAreSolvableWithAvailable = true;
		let anyPossibleAreSolvableWithAvailable = false;
		for (const value of possibleValues) {
			if (summingPathsTo(gap + value, availableEvidenceValues) === 0) {
				allPossibleAreSolvableWithAvailable = false;
				allPossibleAreSolvableWithVisible = false;
			} else {
				anyPossibleAreSolvableWithAvailable = true;
				if (summingPathsTo(gap + value, visibleValues) === 0) {
					allPossibleAreSolvableWithVisible = false;
				}
			}
		}
		if (wedged) {
			if (allPossibleAreSolvableWithVisible) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateUnwedgeForVisible);
			} else if (allPossibleAreSolvableWithAvailable) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateUnwedgeForAvailable);
			} else if (anyPossibleAreSolvableWithAvailable) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateUnwedgeMaybeForAvailable);
			} else {
				addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateBadOnWedged);
			}
		} else {
			addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateBadOnUnwedgedDoesWedge);
		}
	} else if (wouldWedge) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateGoodButWouldWedge);
	} else if (exactType && exactValue) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateGoodMakesConfirmable);
	} else if (exactValue) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateCorrectValue);
	} else if (maybeOver) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateMaybeBad);
	} else if (exactType) {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateCorrectType);
	} else {
		addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateWild);
	}
	return effects;
}
*/

export function buildOptionForLeadWithCard(
	leadType: LeadType,
	handIndex: number,
	effects: BotTurnEffectType[],
	mysteryCard: MysteryCard,
): InvestigateOption {
	return {
		action: {
			actionType: ActionType.Investigate,
			handIndex,
			leadType,
		},
		effects,
		mysteryCard,
		strategyType: BotTurnStrategyType.Investigate,
	};
}

export class InvestigateStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Investigate;

	public buildOptions(turn: TurnStart, bot: Bot): InvestigateOption[] {
		const availableByType = availableValuesByType(turn);
		const options: InvestigateOption[] = [];
		const hand = bot.hand;
		const visibleByType = objectMap(groupBy(turn.otherPlayers.flatMap(op => op.hand), e => e.evidenceType), e => e.map(c => c.evidenceValue));
		for (const lead of unfinishedLeads(turn)) {
			const evidenceType = lead.leadCard.evidenceType;
			const availableEvidenceValues: EvidenceValue[] = availableByType[evidenceType];
			const visibleValues = visibleByType[evidenceType] || [];
			for (let handIndex = 0; handIndex < hand.length; handIndex++) {
				const mysteryCard = hand[handIndex];
				const effects = buildInvestigateEffectsForLeadWithCard(lead, mysteryCard, availableEvidenceValues, visibleValues);
				const option = buildOptionForLeadWithCard(lead.leadCard.leadType, handIndex, effects, mysteryCard);
				options.push(option);
			}
		}
		return reduceOptionsComparingOptions(options, (a: InvestigateOption, b: InvestigateOption) => {
			// In general, investigate with smaller values so we can save bigger values to eliminate.
			return b.mysteryCard.averageValue() < a.mysteryCard.averageValue() ? CompareResult.Second : CompareResult.First;
		});
	}
}
