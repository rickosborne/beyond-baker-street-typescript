import { Action, isActionOfType } from "./Action";
import { ActionType } from "./ActionType";
import { isLeadType, LeadType } from "./LeadType";
import { EvidenceCard, formatEvidence } from "./EvidenceCard";
import { formatLeadCard, LeadCard } from "./LeadCard";
import { formatMysteryCard, MysteryCard } from "./MysteryCard";
import { Outcome, OutcomeType } from "./Outcome";
import { Player } from "./Player";
import { TurnStart } from "./TurnStart";

export interface InvestigateAction extends Action {
	actionType: ActionType.Investigate;
	handIndex: number;
	leadType: LeadType;
}

export function isInvestigateAction(maybe: unknown): maybe is InvestigateAction {
	const ia = maybe as InvestigateAction;
	// noinspection SuspiciousTypeOfGuard
	return isActionOfType(maybe, ActionType.Investigate)
		&& (typeof ia.handIndex === "number")
		&& isLeadType(ia.leadType);
}

export enum InvestigateOutcomeType {
	/**
	 * Incorrect evidence type.
	 */
	Bad = "Bad",
	/**
	 * Correct evidence type, but over target.
	 */
	DeadLead = "DeadLead",
	/**
	 * Evidence type matches AND value does not go over.
	 */
	Good = "Good",
}

export interface InvestigateOutcome extends Outcome {
	evidenceCard: EvidenceCard;
	investigateOutcomeType: InvestigateOutcomeType;
}

export interface GoodInvestigateOutcome extends InvestigateOutcome {
	accumulatedValue: number;
	action: InvestigateAction;
	badValue: number;
	investigateOutcomeType: InvestigateOutcomeType.Good;
	outcomeType: OutcomeType.GoodInvestigate;
	targetValue: number;
	totalValue: number;
}

export function isGoodInvestigateOutcome(maybe: unknown): maybe is GoodInvestigateOutcome {
	const o = maybe as GoodInvestigateOutcome;
	return (o != null) && (o.outcomeType === OutcomeType.GoodInvestigate) && (o.investigateOutcomeType === InvestigateOutcomeType.Good);
}

export interface DeadLeadInvestigateOutcome extends InvestigateOutcome {
	action: InvestigateAction;
	impossibleCount: number;
	investigateOutcomeType: InvestigateOutcomeType.DeadLead;
	nextLead: LeadCard | undefined;
	outcomeType: OutcomeType.DeadLead;
	returnedEvidence: EvidenceCard[];
}

export function isDeadLeadInvestigateOutcome(maybe: unknown): maybe is DeadLeadInvestigateOutcome {
	const o = maybe as DeadLeadInvestigateOutcome;
	return (o != null) && (o.outcomeType === OutcomeType.DeadLead) && (o.investigateOutcomeType === InvestigateOutcomeType.DeadLead);
}

export interface BadInvestigateOutcome extends InvestigateOutcome {
	accumulatedValue: number;
	action: InvestigateAction;
	badValue: number;
	investigateOutcomeType: InvestigateOutcomeType.Bad;
	outcomeType: OutcomeType.BadInvestigate;
	targetValue: number;
	totalValue: number;
}

export function isBadInvestigateOutcome(maybe: unknown): maybe is BadInvestigateOutcome {
	const o = maybe as BadInvestigateOutcome;
	return (o != null) && (o.outcomeType === OutcomeType.BadInvestigate);
}

export function formatInvestigate(investigate: InvestigateAction, card: MysteryCard | undefined, turnStart: TurnStart): string {
	return `${turnStart.player.name} investigates ${formatLeadCard(turnStart.board.leads[investigate.leadType].leadCard)} with ${card == null ? "unknown card" : formatMysteryCard(card)}.`;
}

export function formatBadInvestigateOutcome(outcome: BadInvestigateOutcome): string {
	return `${outcome.activePlayer.name} investigated ${outcome.action.leadType} with ${formatEvidence(outcome.evidenceCard)}.  It's a bad lead!  ${outcome.accumulatedValue}/${outcome.badValue}+${outcome.targetValue}`;
}

export function formatDeadLeadInvestigateOutcome(outcome: DeadLeadInvestigateOutcome): string {
	return `${outcome.activePlayer.name} investigated ${outcome.action.leadType} with ${formatEvidence(outcome.evidenceCard)}.  It's a dead lead!  ${outcome.nextLead == null ? `No ${outcome.action.leadType} leads remain!`: `New lead is ${outcome.nextLead.evidenceType}-${outcome.nextLead.evidenceTarget}.`}`;
}

export function formatGoodInvestigateOutcome(outcome: GoodInvestigateOutcome): string {
	return `${outcome.activePlayer.name} investigated ${outcome.action.leadType} with ${formatEvidence(outcome.evidenceCard)}.  It's good!  ${outcome.accumulatedValue}/${outcome.totalValue} found.`;
}
