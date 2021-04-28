import { Action, isActionOfType } from "./Action";
import { ActionType } from "./ActionType";
import { isPlayer, Player } from "./Player";
import { EvidenceValue, isEvidenceValue } from "./EvidenceValue";
import { EvidenceType, isEvidenceType } from "./EvidenceType";
import { Outcome, OutcomeType } from "./Outcome";
import { TurnStart } from "./TurnStart";

export enum AssistType {
	Type = "Type",
	Value = "Value",
}

export interface AssistAction extends Action {
	actionType: ActionType.Assist;
	assistType: AssistType;
	player: Player;
}

export function isAssistActionOfType(maybe: unknown, assistType: AssistType): maybe is AssistAction {
	const aa = maybe as AssistAction;
	return isActionOfType(maybe, ActionType.Assist)
		&& (aa.assistType === assistType)
		&& isPlayer(aa.player);
}

export interface TypeAssistAction extends AssistAction {
	assistType: AssistType.Type;
	evidenceType: EvidenceType;
}

export function isTypeAssistAction(maybe: unknown): maybe is TypeAssistAction {
	const ta = maybe as TypeAssistAction;
	return isAssistActionOfType(maybe, AssistType.Type)
		&& isEvidenceType(ta.evidenceType);
}

export interface ValueAssistAction extends AssistAction {
	assistType: AssistType.Value;
	evidenceValue: EvidenceValue;
}

export function isValueAssistAction(maybe: unknown): maybe is ValueAssistAction {
	const va = maybe as ValueAssistAction;
	return isAssistActionOfType(maybe, AssistType.Value)
		&& isEvidenceValue(va.evidenceValue);
}

export interface AssistOutcome extends Outcome {
	action: AssistAction;
	holmesLocation: number;
	identifiedHandIndexes: number[];
	outcomeType: OutcomeType.Assist;
}

export function isAssistOutcome(maybe: unknown): maybe is AssistOutcome {
	const o = maybe as AssistOutcome;
	return (o != null) && (o.outcomeType === OutcomeType.Assist);
}

function formatTypeAssist(assist: TypeAssistAction, player: Player, holmesLocation: number): string {
	return `${player.name} assisted ${assist.player.name} with type ${assist.evidenceType}.  Holmes is at ${holmesLocation}.`;
}

function formatValueAssist(assist: ValueAssistAction, player: Player, holmesLocation: number): string {
	return `${player.name} assisted ${assist.player.name} with value ${assist.evidenceValue}.  Holmes is at ${holmesLocation}.`;
}

export function formatAssist(assist: AssistAction, player: Player, holmesLocation: number): string {
	if (isTypeAssistAction(assist)) {
		return formatTypeAssist(assist, player, holmesLocation);
	} else if (isValueAssistAction(assist)) {
		return formatValueAssist(assist, player, holmesLocation);
	}
	throw new Error(`Unknown assist type: ${assist}`);
}

export function formatAssistOutcome(outcome: AssistOutcome): string {
	return formatAssist(outcome.action, outcome.activePlayer, outcome.holmesLocation);
}