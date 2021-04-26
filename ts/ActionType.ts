export enum ActionType {
	Assist = "Assist",
	Confirm = "Confirm",
	Eliminate = "Eliminate",
	Investigate = "Investigate",
	Pursue = "Pursue",
}

export const ACTION_TYPES: ActionType[] = [
	ActionType.Assist,
	ActionType.Confirm,
	ActionType.Eliminate,
	ActionType.Investigate,
	ActionType.Pursue,
];

export function isActionType(maybe: unknown): maybe is ActionType {
	return (typeof maybe === "string")
		&& ACTION_TYPES.includes(maybe as ActionType);
}
