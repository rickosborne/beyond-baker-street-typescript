import { PseudoRNG } from "./rng";
import { shuffleInPlace } from "./shuffle";

export class Pile<C> {
	protected readonly cards: C[] = [];

	public addAt(card: C, index: number): void {
		if (index < 0 || index > this.cards.length) {
			throw new Error(`addAt expected index [0,${this.cards.length}], got ${index}`);
		}
		this.cards.splice(index, 0, card);
	}

	public addToBottom(card: C): void {
		this.cards.push(card);
	}

	public addToTop(card: C): void {
		this.cards.unshift(card);
	}

	public get bottomCard(): C | undefined {
		return this.cards.length > 0 ? this.cards[this.cards.length - 1] : undefined;
	}

	public get count(): number {
		return this.cards.length;
	}

	public empty(): void {
		this.cards.splice(0, this.cards.length);
	}

	public get isEmpty(): boolean {
		return this.cards.length === 0;
	}

	public shuffle(prng: PseudoRNG): void {
		shuffleInPlace(this.cards, prng);
	}

	public sum(valueExtractor: (card: C) => number, start = 0): number {
		let result = start;
		for (const card of this.cards) {
			result += valueExtractor(card);
		}
		return result;
	}

	public takeFromBottom(): C | undefined {
		return this.cards.pop();
	}

	public takeFromTop(): C | undefined {
		return this.cards.shift();
	}

	public toArray(): C[] {
		return this.cards.slice();
	}

	// noinspection JSUnusedGlobalSymbols
	public toJSON(): Record<string, unknown> {
		return {
			cardCount: this.cards.length,
		};
	}

	public get topCard(): C | undefined {
		return this.cards.length > 0 ? this.cards[0] : undefined;
	}
}
