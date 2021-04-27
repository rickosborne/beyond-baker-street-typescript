import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { TurnStart } from "./TurnStart";
import { Bot } from "./Bot";
import { LEAD_TYPES } from "./LeadType";
import { unconfirmedLeads } from "./unconfirmedLeads";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { EvidenceCard, isEvidenceCard } from "./EvidenceCard";
import { MysteryCard } from "./MysteryCard";
import { canSumTo } from "./canSumTo";
import { unique } from "./unique";

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
		const options: BotTurnOption[] = [];
		const unconfirmed = unconfirmedLeads(turn);
		for (const lead of unconfirmed) {
			const gap = (lead.badValue + lead.leadCard.evidenceTarget) - lead.evidenceValue;
			if (gap < 1) {
				continue;
			}
			const knownValues = this.gatherEvidence(lead.leadCard.evidenceType, turn, bot.hand);
			if (canSumTo(gap, knownValues)) {

			}
		}
		return options;
	}

	private gatherEvidence(evidenceType: EvidenceType, turn: TurnStart, hand: MysteryCard[]): EvidenceValue[] {
		const values: EvidenceValue[] = [];
		for (const otherPlayer of turn.otherPlayers) {
			this.gatherEvidenceFromCards(evidenceType, otherPlayer.hand, values);
		}
		this.gatherEvidenceFromCards(evidenceType, turn.board.impossibleCards.filter(c => isEvidenceCard(c)) as EvidenceCard[], values);
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

}
