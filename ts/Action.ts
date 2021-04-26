import { ActionType, isActionType } from "./ActionType";

export interface Action<A extends ActionType> {
	actionType: A;
}

export function isAction<A extends ActionType>(maybe: unknown, actionType: A): maybe is Action<A> {
	const a = maybe as Action<A>;
	return (maybe != null)
		&& (a.actionType === actionType);
}
