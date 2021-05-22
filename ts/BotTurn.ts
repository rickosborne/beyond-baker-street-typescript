import { Action } from "./Action";
import { Bot } from "./Bot";
import { enumKeys } from "./enumKeys";
import { TurnStart } from "./TurnStart";

export enum BotTurnEffectType {
	AssistNotHope = "AssistNotHope",
	AssistExactEliminate = "AssistExactEliminate",
	AssistImpossibleType = "AssistImpossibleType",
	AssistKnown = "AssistKnown",
	AssistNarrow = "AssistNarrow",
	AssistNextPlayer = "AssistNextPlayer",
	Confirm = "Confirm",
	ConfirmEventually = "ConfirmEventually",
	ConfirmNotBaynes = "ConfirmNotBaynes",
	ConfirmReady = "ConfirmReady",
	/**
	 * This evidence could be used on a lead, but it also could complete the investigation.
	 */
	EliminateMaybeUsefulCompletesInvestigation = "EliminateMaybeUsefulCompletesInvestigation",
	/**
	 * This evidence has the potential to help with a lead.
	 */
	EliminateMaybeUseful = "EliminateMaybeUseful",
	EliminateMightLose = "EliminateMightLose",
	EliminatePossibility = "EliminatePossibility",
	/**
	 * This evidence could be used on a lead, but it also could set up completing the investigation.
	 */
	EliminateMaybeUsefulSetsUpExact = "EliminateMaybeUsefulSetsUpExact",
	/**
	 * This evidence does not seem to help any leads.
	 */
	EliminateUnused = "EliminateUnused",
	/**
	 * This evidence doesn't seem useful for a lead, but would complete the investigation.
	 */
	EliminateUnusedCompletesInvestigation = "EliminateUnusedCompletesInvestigation",
	/**
	 * This evidence doesn't seem useful for a lead, but may be a viable part of the investigation.
	 */
	EliminateUnusedSetsUpExact = "EliminateUnusedSetsUpExact",
	/**
	 * Eliminating this card would wedge the investigation.
	 */
	EliminateWedgesInvestigation = "EliminateWedgesInvestigation",
	/**
	 * This card is critical for confirming a lead.
	 */
	EliminateWedgesLead = "EliminateWedgesLead",
	HolmesImpeded = "HolmesImpeded",
	HolmesProgress = "HolmesProgress",
	ImpossibleAdded = "ImpossibleAdded",
	/**
	 * This card is bad, but there's still a hypothetical solution.
	 */
	InvestigateBadButAvailable = "InvestigateBadButAvailable",
	/**
	 * This card is bad, but there's still a visible solution.
	 */
	InvestigateBadButVisible = "InvestigateBadButVisible",
	/**
	 * The lead is not wedged, but this adds bad evidence which would wedge it.
	 */
	InvestigateBadOnUnwedgedDoesWedge = "InvestigateBadOnUnwedgedDoesWedge",
	/**
	 * The lead is already wedged, and adding this card doesn't help.
	 */
	InvestigateBadOnWedged = "InvestigateBadOnWedged",
	/**
	 * The lead is currently confirmable, but this bad evidence breaks that.
	 */
	InvestigateBreaksConfirmable = "InvestigateBreaksConfirmable",
	/**
	 * This is the correct type, and it leads to a visible solution.
	 */
	InvestigateGoodAndAvailable = "InvestigateGoodAndAvailable",
	/**
	 * This is the correct type, and it leads to a visible solution.
	 */
	InvestigateGoodAndVisible = "InvestigateGoodAndVisible",
	/**
	 * When you put down evidence which prevents the lead from being solved due to available cards.
	 */
	InvestigateGoodButWouldWedge = "InvestigateGoodButWouldWedge",
	/**
	 * This is the correct type, and makes the lead confirmable.
	 */
	InvestigateGoodMakesConfirmable = "InvestigateGoodMakesConfirmable",
	InvestigatePossibility = "InvestigatePossibility",
	/**
	 * This is the right type, but makes the value overshoot the target.
	 */
	InvestigateTooFar = "InvestigateTooFar",
	/**
	 * Adding this bad evidence would make the lead unreachable.
	 */
	InvestigateTooMuchBad = "InvestigateTooMuchBad",
	/**
	 * An investigation is currently wedged, but adding this bad card would unwedge it, eventually.
	 */
	InvestigateUnwedgeForAvailable = "InvestigateUnwedgeForAvailable",
	/**
	 * An investigation is currently wedged, but adding this bad card would unwedge it with visible cards.
	 */
	InvestigateUnwedgeForVisible = "InvestigateUnwedgeForVisible",
	InvestigationComplete = "InvestigationComplete",
	Lose = "Lose",
	PursueConfirmable = "PursueConfirmable",
	PursueDuplicate = "PursueDuplicate",
	PursueImpossible = "PursueImpossible",
	PursueMaybe = "PursueMaybe",
	PursuePossible = "PursuePossible",
	Toby = "Toby",
	Win = "Win",
}

// noinspection SuspiciousTypeOfGuard
export const BOT_TURN_EFFECT_TYPES: BotTurnEffectType[] = enumKeys<BotTurnEffectType>(BotTurnEffectType);

export function isBotTurnEffectType(maybe: unknown): maybe is BotTurnEffectType {
	return (maybe != null)
		&& (typeof maybe === "string")
		&& BOT_TURN_EFFECT_TYPES.includes(maybe as BotTurnEffectType);
}

export interface BotTurnOption {
	action: Action;
	effects: BotTurnEffectType[];
	strategyType: BotTurnStrategyType;
}

export interface BotTurnStrategy {
	buildOptions(turn: TurnStart, bot: Bot): BotTurnOption[];
	strategyType: BotTurnStrategyType;
}

export enum BotTurnStrategyType {
	Assist = "Assist",
	Confirm = "Confirm",
	Eliminate = "Eliminate",
	Inspector = "Inspector",
	Investigate = "Investigate",
	Pursue = "Pursue",
}

export const IGNORE_EFFECT_TYPES = [ BotTurnEffectType.Win, BotTurnEffectType.Lose ];
export const MUTABLE_EFFECT_TYPES = BOT_TURN_EFFECT_TYPES.filter((key: BotTurnEffectType) => !IGNORE_EFFECT_TYPES.includes(key));
