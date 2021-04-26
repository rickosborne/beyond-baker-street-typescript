import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { EvidenceCard } from "./EvidenceCard";
import { TurnStart } from "./TurnStart";
import { Outcome } from "./Outcome";

export interface Player {
	readonly name: string;
}

export interface OtherPlayer extends Player {
	readonly hand: EvidenceCard[];
}

export interface ActivePlayer extends Player {
	sawOutcome(outcome: Outcome): void;
	takeTurn(turnStart: TurnStart): Action<ActionType>;
}

export const PLAYER_NAMES: string[] = [
	"Alice",
	"Bryce",
	"Chuck",
	"Daisy",
];

export function isPlayer(maybe: unknown): maybe is Player {
	const p = maybe as Player;
	// noinspection SuspiciousTypeOfGuard
	return (maybe != null)
		&& (typeof p.name === "string");
}

export function isSamePlayer(a: Player, b: Player): boolean {
	return a === b || a.name === b.name;
}
