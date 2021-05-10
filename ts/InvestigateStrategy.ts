import { ActionType } from "./ActionType";
import { addEffectsIfNotPresent } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { InvestigateAction } from "./InvestigateAction";
import { MysteryCard } from "./MysteryCard";
import { TurnStart } from "./TurnStart";
import { unfinishedLeads } from "./unconfirmedLeads";
import { VisibleLead } from "./VisibleBoard";

export interface InvestigateOption extends BotTurnOption {
	action: InvestigateAction,
	strategyType: BotTurnStrategyType.Investigate,
}

export class InvestigateStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Investigate;

	public buildEffectsForLeadWithCard(
		lead: VisibleLead,
		mysteryCard: MysteryCard,
	): BotTurnEffectType[] {
		const { evidenceType, evidenceTarget } = lead.leadCard;
		const effects: BotTurnEffectType[] = [];
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
			addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateBad);
		} else if (exactType && exactValue) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigatePerfect);
		} else if (exactValue) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateCorrectValue);
		} else if (maybeOver > 0) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateMaybeBad);
		} else if (exactType) {
			addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateCorrectType);
		} else {
			addEffectsIfNotPresent(effects, BotTurnEffectType.InvestigateWild);
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
