import { ActionType } from "./ActionType";

export interface Action {
	actionType: ActionType;
}

export interface TypedAction<T extends ActionType> extends Action {
	actionType: T;
}

export function isActionOfType<T extends ActionType>(maybe: unknown, actionType: T): maybe is TypedAction<T> {
	const a = maybe as Action;
	return (maybe != null) && (a.actionType === actionType);
}
