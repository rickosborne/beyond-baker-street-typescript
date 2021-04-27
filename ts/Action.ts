import { ActionType, isActionType } from "./ActionType";

export interface Action {
	actionType: ActionType;
}

export function isActionOfType(maybe: unknown, actionType: ActionType): maybe is Action {
	const a = maybe as Action;
	return (maybe != null) && (a.actionType === actionType);
}
