import { ActionType } from "./ActionType";
import { addEffect } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffect, BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { InvestigateAction } from "./InvestigateAction";
import { MysteryCard } from "./MysteryCard";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";
import { VisibleLead } from "./VisibleBoard";

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

	public buildEffectsForLeadWithCard(
		lead: VisibleLead,
		mysteryCard: MysteryCard,
	): BotTurnEffect[] {
		const { evidenceType, evidenceTarget } = lead.leadCard;
		const effects: BotTurnEffect[] = [];
		const { possibleTypes, possibleValues } = mysteryCard;
		const singleType = possibleTypes.length === 1;
		const exactType = singleType && possibleTypes[0] === evidenceType;
		const total = evidenceTarget + lead.badValue;
		const gap = total - lead.evidenceValue;
		const singleValue = possibleValues.length === 1;
		const exactValue = singleValue && possibleValues[0] === gap;
		const possibleType = exactType || possibleTypes.includes(evidenceType);
		const maybeOver = possibleValues.filter(v => v > gap).length;
		if (!possibleType) {
			addEffect<InvestigateBadEffect>(effects, {
				effectType: BotTurnEffectType.InvestigateBad,
				wouldAdd: possibleValues.slice(),
			});
		} else if (exactType && exactValue) {
			addEffect<InvestigatePerfectEffect>(effects, {
				effectType: BotTurnEffectType.InvestigatePerfect,
			});
		} else if (exactValue) {
			addEffect<InvestigateCorrectValueEffect>(effects, {
				effectType: BotTurnEffectType.InvestigateCorrectValue,
				possibleTypes: possibleTypes.slice(),
			});
		} else if (maybeOver > 0) {
			addEffect<InvestigateMaybeOverEffect>(effects, {
				effectType: BotTurnEffectType.InvestigateMaybeBad,
				maybeOver,
				possibleTypes: possibleTypes.slice(),
				possibleValues: possibleValues.slice(),
			});
		} else if (exactType) {
			addEffect<InvestigateCorrectTypeEffect>(effects, {
				effectType: BotTurnEffectType.InvestigateCorrectType,
				possibleValues: possibleValues.slice(),
			});
		} else {
			addEffect<InvestigateWildEffect>(effects, {
				effectType: BotTurnEffectType.InvestigateWild,
				maybeOver,
				possibleTypes: possibleTypes.slice(),
				possibleValues: possibleValues.slice(),
			});
		}
		return effects;
	}

	public buildOptionForLeadWithCard(
		lead: VisibleLead,
		mysteryCard: MysteryCard,
		handIndex: number,
	): InvestigateOption {
		return {
			action: {
				actionType: ActionType.Investigate,
				handIndex,
				leadType: lead.leadCard.leadType,
			},
			effects: this.buildEffectsForLeadWithCard(lead, mysteryCard),
			strategyType: BotTurnStrategyType.Investigate,
		};
	}

	public buildOptions(turn: TurnStart, bot: Bot): InvestigateOption[] {
		return unfinishedLeads(turn)
			.flatMap(lead => bot.hand.map((mysteryCard, handIndex) => this.buildOptionForLeadWithCard(lead, mysteryCard, handIndex)))
			;
	}
}
