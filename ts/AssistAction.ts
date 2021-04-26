import { Action, isAction } from "./Action";
import { ActionType } from "./ActionType";
import { isPlayer, Player } from "./Player";
import { EvidenceValue, isEvidenceValue } from "./EvidenceValue";
import { EvidenceType, isEvidenceType } from "./EvidenceType";
import { Outcome } from "./Outcome";

export enum AssistType {
	Type = "Type",
	Value = "Value",
}

export interface AssistAction<A extends AssistType> extends Action<ActionType> {
	assistType: A;
	player: Player;
}

export function isAssistAction<A extends AssistType>(maybe: unknown, assistType: AssistType): maybe is AssistAction<A> {
	const aa = maybe as AssistAction<A>;
	return isAction(maybe, ActionType.Assist)
		&& (aa.assistType === assistType)
		&& isPlayer(aa.player);
}

export interface TypeAssistAction extends AssistAction<AssistType.Type> {
	evidenceType: EvidenceType;
}

export function isTypeAssistAction(maybe: unknown): maybe is TypeAssistAction {
	const ta = maybe as TypeAssistAction;
	return isAssistAction(maybe, AssistType.Type)
		&& isEvidenceType(ta.evidenceType);
}

export interface ValueAssistAction extends AssistAction<AssistType.Value> {
	evidenceValue: EvidenceValue;
}

export function isValueAssistAction(maybe: unknown): maybe is ValueAssistAction {
	const va = maybe as ValueAssistAction;
	return isAssistAction(maybe, AssistType.Value)
		&& isEvidenceValue(va.evidenceValue);
}

export interface AssistOutcome extends Outcome {
	identifiedHandIndexes: number[];
}
