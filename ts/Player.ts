import { Action } from "./Action";
import { BlackwellChoice, BlackwellTurn } from "./Blackwell";
import { EvidenceCard } from "./EvidenceCard";
import { InspectorType } from "./InspectorType";
import { OtherHand } from "./OtherHand";
import { Outcome } from "./Outcome";
import { BottomOrTop } from "./Toby";
import { TurnStart } from "./TurnStart";

export interface Player {
	readonly inspector?: InspectorType | undefined;
	readonly name: string;
}

export interface PlayerInspector<I extends InspectorType> extends Player {
	readonly inspector: I;
}

export interface OtherPlayer extends Player {
	readonly hand: EvidenceCard[];
}

export interface ActivePlayer extends Player {
	addCard(index: number, evidenceCard: EvidenceCard | undefined, fromRemainingEvidence: boolean): void;
	chooseForBlackwell(blackwellTurn: BlackwellTurn): BlackwellChoice;
	readonly otherHand: OtherHand;
	removeCardAt(index: number): void;
	sawEvidenceDealt(player: Player, evidenceCard: EvidenceCard | undefined, handIndex: number): void;
	sawEvidenceReturned(evidenceCards: EvidenceCard[], bottomOrTop: BottomOrTop, shuffle: boolean): void;
	sawOutcome(outcome: Outcome): void;
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

export function isPlayerInspector<I extends InspectorType>(maybe: unknown, inspectorType: I): maybe is PlayerInspector<I> {
	return isPlayer(maybe) && maybe.inspector === inspectorType;
}

export function formatPlayer(player: Player): string {
	return player.name;
}
