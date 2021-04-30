import { Action } from "./Action";
import { EvidenceCard } from "./EvidenceCard";
import { TurnStart } from "./TurnStart";
import { Outcome } from "./Outcome";
import { OtherHand } from "./OtherHand";

export interface Player {
	readonly name: string;
}

export interface OtherPlayer extends Player {
	readonly hand: EvidenceCard[];
}

export interface ActivePlayer extends Player {
	addCard(index: number, evidenceCard: EvidenceCard | undefined, fromRemainingEvidence: boolean): void;
	readonly otherHand: OtherHand;
	removeCardAt(index: number): void;
	sawOutcome(outcome: Outcome): void;
	setHandCount(handCount: number): void;
	takeTurn(turnStart: TurnStart): Action;
}

export function isPlayer(maybe: unknown): maybe is Player {
	const p = maybe as Player;
	// noinspection SuspiciousTypeOfGuard
	return (maybe != null)
		&& (typeof p.name === "string");
}

export function isSamePlayer(a: Player, b: Player): boolean {
	return a === b || a.name === b.name;
}
