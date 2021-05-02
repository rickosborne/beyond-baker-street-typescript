import { ActionType } from "./ActionType";
import { addEffect } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { EvidenceCard, isEvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { addImpossibleAddedEffectsFromTurn } from "./ImpossibleAdded";
import { LEAD_TYPES } from "./LeadType";
import { addLoseEffect } from "./LoseEffect";
import { MysteryCard } from "./MysteryCard";
import { PursueAction } from "./PursueAction";
import { allPathsTo, MAX_POSSIBLE_EVIDENCE_VALUE, summingPathsTo } from "./summingPathsTo";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";
import { unique } from "./unique";
import { VisibleLead } from "./VisibleBoard";

export interface PursueOption extends BotTurnOption {
	action: PursueAction;
	strategyType: BotTurnStrategyType.Pursue;
}

/**
 * Pursue a lead which is known to be impossible to complete.
 */
export interface PursueImpossibleEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.PursueImpossible;
}

/**
 * Pursue a lead which might be possible or impossible to complete.
 */
export interface PursueMaybeEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.PursueMaybe;
	pathCount: number;
}

/**
 * Pursue a lead which we know is possible to complete.
 */
export interface PursuePossibleEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.PursuePossible;
}

/**
 * Pursue a lead where another lead shares the same evidence type.
 */
export interface PursueDuplicateEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.PursueDuplicate;
	evidenceTarget: EvidenceValue;
}

export class PursueStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Pursue;

	public buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[] {
		const visibleLeads = unfinishedLeads(turn);
		return visibleLeads
			.map(lead => this.buildPursueForLead(lead, visibleLeads, turn, bot))
			.filter(option => option != null) as PursueOption[]
			;
	}

	private buildPursueForLead(lead: VisibleLead, allLeads: VisibleLead[], turn: TurnStart, bot: Bot): PursueOption | undefined {
		const { evidenceTarget, evidenceType } = lead.leadCard;
		const totalValue = lead.badValue + evidenceTarget;
		const gap = totalValue - lead.evidenceValue;
		const effects: BotTurnEffect[] = [];
		addImpossibleAddedEffectsFromTurn(effects, turn);
		if (lead.leadCount === 1) {
			addLoseEffect(effects);
		}
		const otherLeads = allLeads.filter(l => l !== lead);
		if (lead.evidenceCards.length === 0 && otherLeads.find(l => l.leadCard.evidenceType === evidenceType) != null) {
			addEffect<PursueDuplicateEffect>(effects, {
				effectType: BotTurnEffectType.PursueDuplicate,
				evidenceTarget: evidenceTarget,
			});
		}
		if (gap < 1) {
			addEffect<PursuePossibleEffect>(effects, {
				effectType: BotTurnEffectType.PursuePossible,
			});
		} else if (totalValue > MAX_POSSIBLE_EVIDENCE_VALUE) {
			addEffect<PursueImpossibleEffect>(effects, {
				effectType: BotTurnEffectType.PursueImpossible,
			});
		} else {
			const knownValues = this.gatherEvidence(evidenceType, turn, bot.hand);
			const pathCount = summingPathsTo(gap, knownValues);
			if (pathCount > 0) {
				addEffect<PursuePossibleEffect>(effects, {
					effectType: BotTurnEffectType.PursuePossible,
				});
			} else {
				const impossibleValues: EvidenceValue[] = [];
				this.gatherEvidenceFromImpossible(evidenceType, turn, impossibleValues);
				impossibleValues.sort();
				const allPaths = allPathsTo(totalValue);
				if (!Array.isArray(allPaths) || allPaths.length === 0) {
					throw new Error(`Unable to figure out card paths to ${totalValue}!`);
				}
				const paths = allPaths.filter(p => impossibleValues.findIndex(i => p.includes(i)) < 0);
				if (impossibleValues.length > 0 && paths.length === 0) {
					addEffect<PursueImpossibleEffect>(effects, {
						effectType: BotTurnEffectType.PursueImpossible,
					});
				} else {
					addEffect<PursueMaybeEffect>(effects, {
						effectType: BotTurnEffectType.PursueMaybe,
						pathCount: paths.length,
					});
				}
			}
		}
		return {
			action: {
				actionType: ActionType.Pursue,
				leadType: lead.leadCard.leadType,
			},
			effects,
			strategyType: BotTurnStrategyType.Pursue,
		};
	}

	private gatherEvidence(evidenceType: EvidenceType, turn: TurnStart, hand: MysteryCard[]): EvidenceValue[] {
		const values: EvidenceValue[] = [];
		for (const otherPlayer of turn.otherPlayers) {
			this.gatherEvidenceFromCards(evidenceType, otherPlayer.hand, values);
		}
		this.gatherEvidenceFromImpossible(evidenceType, turn, values);
		for (const lead of LEAD_TYPES.map(leadType => turn.board.leads[leadType])) {
			this.gatherEvidenceFromCards(evidenceType, lead.badCards, values);
			this.gatherEvidenceFromCards(evidenceType, lead.evidenceCards, values);
		}
		hand.filter(mc => mc.isKnown && mc.possibleTypes[0] === evidenceType)
			.forEach(mc => values.push(mc.possibleValues[0]));
		return unique(values);
	}

// noinspection JSMethodCanBeStatic
	private gatherEvidenceFromCards(
		evidenceType: EvidenceType,
		cards: EvidenceCard[],
		values: EvidenceValue[],
	): void {
		for (const card of cards) {
			if (card.evidenceType === evidenceType) {
				values.push(card.evidenceValue);
			}
		}
	}

	private gatherEvidenceFromImpossible(evidenceType: EvidenceType, turn: TurnStart, values: EvidenceValue[]): void {
		this.gatherEvidenceFromCards(evidenceType, turn.board.impossibleCards.filter(c => isEvidenceCard(c)) as EvidenceCard[], values);
	}

}
