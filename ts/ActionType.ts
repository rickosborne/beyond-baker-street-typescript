export enum ActionType {
	Adler = "Adler",
	Baskerville = "Baskerville",
	Assist = "Assist",
	Confirm = "Confirm",
	Eliminate = "Eliminate",
	Hope = "Hope",
	Hudson = "Hudson",
	Investigate = "Investigate",
	Pike = "Pike",
	Pursue = "Pursue",
	Toby = "Toby",
}

export const ACTION_TYPES: ActionType[] = [
	ActionType.Adler,
	ActionType.Baskerville,
	ActionType.Assist,
	ActionType.Confirm,
	ActionType.Eliminate,
	ActionType.Hope,
	ActionType.Hudson,
	ActionType.Investigate,
	ActionType.Pike,
	ActionType.Pursue,
];

export function isActionType(maybe: unknown): maybe is ActionType {
	return (typeof maybe === "string")
		&& ACTION_TYPES.includes(maybe as ActionType);
}
