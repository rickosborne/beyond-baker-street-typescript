import { CardType } from "./CardType";
import { CaseFileCard } from "./CaseFileCard";

export interface Card<T extends CardType> {
	cardType: T;
}

export function isCardOfType<T extends CardType>(maybe: unknown, type: T): maybe is Card<T> {
	return (maybe != null)
		&& (type != null)
		&& ((maybe as CaseFileCard).cardType === type);
}
