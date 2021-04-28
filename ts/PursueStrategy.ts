import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { TurnStart } from "./TurnStart";
import { Bot } from "./Bot";
import { LEAD_TYPES } from "./LeadType";
import { unconfirmedLeads } from "./unconfirmedLeads";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { EvidenceCard, isEvidenceCard } from "./EvidenceCard";
import { MysteryCard } from "./MysteryCard";
import { ALL_PATHS_TO, MAX_POSSIBLE_EVIDENCE_VALUE, summingPathsTo } from "./summingPathsTo";
import { unique } from "./unique";
import { PursueAction } from "./PursueAction";
import { ActionType } from "./ActionType";
import { VisibleLead } from "./VisibleBoard";
import { HolmesProgressEffect } from "./HolmesProgressEffect";
import { HOLMES_MOVE_ASSIST, HOLMES_MOVE_PURSUE } from "./Game";

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

export class PursueStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Pursue;

	public buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[] {
		return unconfirmedLeads(turn)
			.map(lead => this.buildPursueForLead(lead, turn, bot))
			.filter(option => option != null) as PursueOption[]
		;
	}

	private buildPursueForLead(lead: VisibleLead, turn: TurnStart, bot: Bot): PursueOption | undefined {
		const totalValue = lead.badValue + lead.leadCard.evidenceTarget;
		const gap = totalValue - lead.evidenceValue;
		if (gap < 1) {
			return undefined;
		}
		const effects: BotTurnEffect[] = [];
		if (turn.board.impossibleCards.length + 1 > turn.board.caseFile.impossibleCount) {
			const holmesEffect: HolmesProgressEffect = {
				delta: HOLMES_MOVE_PURSUE,
				effectType: BotTurnEffectType.HolmesProgress,
			};
			effects.push(holmesEffect);
		}
		if (totalValue > MAX_POSSIBLE_EVIDENCE_VALUE) {
			const imp: PursueImpossibleEffect = {
				effectType: BotTurnEffectType.PursueImpossible,
			};
			effects.push(imp);
		} else {
			const knownValues = this.gatherEvidence(lead.leadCard.evidenceType, turn, bot.hand);
			const pathCount = summingPathsTo(gap, knownValues);
			if (pathCount > 0) {
				const possible: PursuePossibleEffect = {
					effectType: BotTurnEffectType.PursuePossible,
				};
				effects.push(possible);
			} else {
				const impossibleValues: EvidenceValue[] = [];
				this.gatherEvidenceFromImpossible(lead.leadCard.evidenceType, turn, impossibleValues);
				impossibleValues.sort();
				const allPaths = ALL_PATHS_TO[totalValue];
				if (!Array.isArray(allPaths) || allPaths.length === 0) {
					throw new Error(`Unable to figure out card paths to ${totalValue}!`);
				}
				const paths = allPaths.filter(p => impossibleValues.findIndex(i => p.includes(i)) < 0);
				if (impossibleValues.length > 0 && paths.length === 0) {
					const imp: PursueImpossibleEffect = {
						effectType: BotTurnEffectType.PursueImpossible,
					};
					effects.push(imp);
				} else {
					const maybe: PursueMaybeEffect = {
						effectType: BotTurnEffectType.PursueMaybe,
						pathCount: paths.length,
					};
					effects.push(maybe);
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
