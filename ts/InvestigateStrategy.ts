import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { TurnStart } from "./TurnStart";
import { Bot } from "./Bot";
import { unconfirmedLeads } from "./unconfirmedLeads";
import { VisibleLead } from "./VisibleBoard";
import { MysteryCard } from "./MysteryCard";
import { InvestigateAction } from "./InvestigateAction";
import { ActionType } from "./ActionType";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";

export interface InvestigateOption extends BotTurnOption {
	action: InvestigateAction,
	strategyType: BotTurnStrategyType.Investigate,
}

export interface InvestigateBadEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.InvestigateBad;
	wouldAdd: number[];
}

export interface InvestigatePerfectEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.InvestigatePerfect;
}

export interface InvestigateCorrectValueEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.InvestigateCorrectValue;
	possibleTypes: EvidenceType[];
}

export interface InvestigateCorrectTypeEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.InvestigateCorrectType;
	possibleValues: EvidenceValue[];
}

export interface InvestigateMaybeOverEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.InvestigateMaybeBad;
	maybeOver: number;
	possibleTypes: EvidenceType[];
	possibleValues: EvidenceValue[];
}

export interface InvestigateWildEffect extends BotTurnEffect {
	effectType: BotTurnEffectType.InvestigateWild;
	maybeOver: number;
	possibleTypes: EvidenceType[];
	possibleValues: EvidenceValue[];
}

export class InvestigateStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Investigate;

	public buildOptions(turn: TurnStart, bot: Bot): InvestigateOption[] {
		return unconfirmedLeads(turn)
			.flatMap(lead => bot.hand.map((mysteryCard, handIndex) => this.buildOptionsForLeadWithCard(lead, mysteryCard, handIndex)))
			;
	}

	private buildOptionsForLeadWithCard(
		lead: VisibleLead,
		mysteryCard: MysteryCard,
		handIndex: number,
	): InvestigateOption {
		const { evidenceType, evidenceTarget } = lead.leadCard;
		const effects: BotTurnEffect[] = [];
		const singleType = mysteryCard.possibleTypes.length === 1;
		const exactType = singleType && mysteryCard.possibleTypes[0] === evidenceType;
		const total = evidenceTarget + lead.badValue;
		const gap = total - lead.evidenceValue;
		const singleValue = mysteryCard.possibleValues.length === 1;
		const exactValue = singleValue && mysteryCard.possibleValues[0] === gap;
		const possibleType = exactType || mysteryCard.possibleTypes.includes(evidenceType);
		const maybeOver = mysteryCard.possibleValues.filter(v => v > gap).length;
		if (!possibleType) {
			const knownBad: InvestigateBadEffect = {
				effectType: BotTurnEffectType.InvestigateBad,
				wouldAdd: mysteryCard.possibleValues.slice(),
			};
			effects.push(knownBad);
		} else if (exactType && exactValue) {
			const perfect: InvestigatePerfectEffect = {
				effectType: BotTurnEffectType.InvestigatePerfect,
			};
			effects.push(perfect);
		} else if (exactValue) {
			const correctValue: InvestigateCorrectValueEffect = {
				effectType: BotTurnEffectType.InvestigateCorrectValue,
				possibleTypes: mysteryCard.possibleTypes.slice(),
			};
			effects.push(correctValue);
		} else if (maybeOver > 0) {
			const maybeBad: InvestigateMaybeOverEffect = {
				effectType: BotTurnEffectType.InvestigateMaybeBad,
				maybeOver,
				possibleTypes: mysteryCard.possibleTypes.slice(),
				possibleValues: mysteryCard.possibleValues.slice(),
			};
			effects.push(maybeBad);
		} else if (exactType) {
			const correctType: InvestigateCorrectTypeEffect = {
				effectType: BotTurnEffectType.InvestigateCorrectType,
				possibleValues: mysteryCard.possibleValues.slice(),
			};
			effects.push(correctType);
		} else {
			const wild: InvestigateWildEffect = {
				effectType: BotTurnEffectType.InvestigateWild,
				maybeOver,
				possibleTypes: mysteryCard.possibleTypes.slice(),
				possibleValues: mysteryCard.possibleValues.slice(),
			};
			effects.push(wild);
		}
		return {
			action: {
				actionType: ActionType.Investigate,
				handIndex,
				leadType: lead.leadCard.leadType,
			},
			effects,
			strategyType: BotTurnStrategyType.Investigate,
		};
	}
}
