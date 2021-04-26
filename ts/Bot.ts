import { ActivePlayer } from "./Player";
import { Outcome } from "./Outcome";
import { TurnStart } from "./TurnStart";
import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { MysteryCard } from "./MysteryCard";
import { range } from "./range";

export const BOT_NAMES: string[] = [
	"Alice",
	"Bryce",
	"Chuck",
	"Daisy",
	"Edgar",
	"Fiona",
];

const nextName = (function nextName() {
	let index = Math.floor(Math.random() * BOT_NAMES.length);
	return function nextName(): string {
		index = (index + 1) % BOT_NAMES.length;
		return BOT_NAMES[index];
	};
})();

export class Bot implements ActivePlayer {
	private readonly hand: MysteryCard[] = [];

	constructor(public readonly name: string = nextName()) {}

	public sawOutcome(outcome: Outcome): void {
		// TODO: Eliminate cards
	}

	public setHandCount(handCount: number): void {
		this.hand.splice(0, this.hand.length, ...range(1, handCount).map(() => new MysteryCard()));
	}

	public takeTurn(turnStart: TurnStart): Action<ActionType> {
		// TODO: Eliminate Cards
		// TODO: Take Turn
		return undefined;
	}
}
