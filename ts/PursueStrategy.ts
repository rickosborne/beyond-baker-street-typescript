import { ActionType } from "./ActionType";
import { addEffectsIfNotPresent } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { CardType } from "./CardType";
import { EvidenceCard, isEvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { addImpossibleAddedEffectsFromTurn } from "./ImpossibleAdded";
import { LEAD_TYPES } from "./LeadType";
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

export class PursueStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Pursue;

	public buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[] {
		const visibleLeads = unfinishedLeads(turn);
		return LEAD_TYPES
			.map(leadType => turn.board.leads[leadType])
			.map(lead => this.buildPursueForLead(lead, visibleLeads, turn, bot))
			.filter(option => option != null) as PursueOption[]
			;
	}

	private buildPursueForLead(lead: VisibleLead, allLeads: VisibleLead[], turn: TurnStart, bot: Bot): PursueOption | undefined {
		const { evidenceTarget, evidenceType } = lead.leadCard;
		const totalValue = lead.badValue + evidenceTarget;
		const gap = totalValue - lead.evidenceValue;
		const effects: BotTurnEffectType[] = [];
		addImpossibleAddedEffectsFromTurn(effects, turn, CardType.Lead, this.strategyType, bot.inspector);
		if (lead.leadCount === 1) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.Lose);
		}
		const otherLeads = allLeads.filter(l => l !== lead);
		if (lead.evidenceCards.length === 0 && otherLeads.find(l => l.leadCard.evidenceType === evidenceType) != null) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.PursueDuplicate);
		}
		if (gap < 1) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.PursuePossible);
		} else if (totalValue > MAX_POSSIBLE_EVIDENCE_VALUE) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.PursueImpossible);
		} else {
			const knownValues = this.gatherEvidence(evidenceType, turn, bot.hand);
			const pathCount = summingPathsTo(gap, knownValues);
			if (pathCount > 0) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.PursuePossible);
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
					addEffectsIfNotPresent(effects, BotTurnEffectType.PursueImpossible);
				} else {
					addEffectsIfNotPresent(effects, BotTurnEffectType.PursueMaybe);
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
