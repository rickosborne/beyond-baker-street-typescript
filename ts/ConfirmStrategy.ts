import { ActionType } from "./ActionType";
import { addEffectsEvenIfDuplicate, addEffectsIfNotPresent } from "./addEffect";
import { Bot } from "./Bot";
import { BotTurnEffectType, BotTurnOption, BotTurnStrategy, BotTurnStrategyType } from "./BotTurn";
import { ConfirmAction } from "./ConfirmAction";
import { INVESTIGATION_MARKER_GOAL } from "./Game";
import { InspectorType } from "./InspectorType";
import { LeadType } from "./LeadType";
import { TurnStart } from "./TurnStart";
import { unconfirmedLeads } from "./unconfirmedLeads";
import { VisibleLead } from "./VisibleBoard";

export interface ConfirmOption extends BotTurnOption {
	action: ConfirmAction;
	strategyType: BotTurnStrategyType.Confirm;
}

export function isConfirmOption(maybe: unknown): maybe is ConfirmOption {
	return (maybe != null) && ((maybe as ConfirmOption).strategyType === BotTurnStrategyType.Confirm);
}

export function buildConfirmOption(
	leadType: LeadType,
	effects: BotTurnEffectType[],
): ConfirmOption {
	return {
		action: <ConfirmAction>{
			actionType: ActionType.Confirm,
			leadType,
		},
		effects,
		strategyType: BotTurnStrategyType.Confirm,
	};
}

export function buildConfirmOptionForLead(
	lead: VisibleLead,
	inspectorType: InspectorType | undefined,
	unfinishedCount: number,
	investigationMarker: number,
): ConfirmOption | undefined {
	const leadType = lead.leadCard.leadType;
	const wantValues: number[] = [lead.badValue + lead.leadCard.evidenceTarget];
	if (inspectorType === InspectorType.Morstan) {
		wantValues.push(wantValues[0] - 1);
	}
	if (wantValues.includes(lead.evidenceValue)) {
		const effects: BotTurnEffectType[] = [];
		addEffectsIfNotPresent(effects, BotTurnEffectType.Confirm);
		addEffectsIfNotPresent(effects, BotTurnEffectType.HolmesImpeded);
		if (inspectorType === InspectorType.Baynes) {
			// add it a second time, for twice the impact!
			addEffectsEvenIfDuplicate(effects, BotTurnEffectType.HolmesImpeded);
		}
		if (unfinishedCount === 1) {
			if (investigationMarker === INVESTIGATION_MARKER_GOAL) {
				addEffectsIfNotPresent(effects, BotTurnEffectType.Win);
			} else {
				addEffectsIfNotPresent(effects, BotTurnEffectType.Lose);
			}
		}
		return buildConfirmOption(leadType, effects);
	}
	return undefined;
}

export class ConfirmStrategy implements BotTurnStrategy {
	public readonly strategyType = BotTurnStrategyType.Confirm;

	public buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[] {
		const options: BotTurnOption[] = [];
		const unfinished = unconfirmedLeads(turn);
		for (const lead of unfinished) {
			const option = buildConfirmOptionForLead(lead, bot.inspector, unfinished.length, turn.board.investigationMarker);
			if (option != null) {
				options.push(option);
			}
		}
		return options;
	}
}
