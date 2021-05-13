import { Predicate } from "./Predicate";
import { removeIf } from "./removeIf";
import { PseudoRNG } from "./rng";
import { shuffleInPlace } from "./shuffle";

export class Pile<C> {
	protected readonly cards: C[] = [];

	public addToBottom(card: C): void {
		this.cards.push(card);
	}

	public addToTop(card: C): void {
		this.cards.unshift(card);
	}

	public get bottomCard(): C | undefined {
		return this.cards.length === 0 ? undefined : this.cards[this.cards.length - 1];
	}

	public get count(): number {
		return this.cards.length;
	}

	public empty(): void {
		this.cards.splice(0, this.cards.length);
	}

	public find(predicate: Predicate<C>): C | undefined {
		return this.cards.find(predicate);
	}

	public removeIf(predicate: Predicate<C>): number {
		return removeIf(this.cards, predicate);
	}

	public shuffle(prng?: PseudoRNG | undefined): void {
		shuffleInPlace(this.cards, prng);
	}

	public sum(valueExtractor: (card: C) => number, start = 0): number {
		let result = start;
		for (const card of this.cards) {
			result += valueExtractor(card);
		}
		return result;
	}

	public swapOne(replacement: C, predicate: Predicate<C>): boolean {
		const index = this.cards.findIndex(predicate);
		if (index >= 0) {
			this.cards.splice(index, 1, replacement);
			return true;
		}
		return false;
	}

	public takeFromTop(): C | undefined {
		return this.cards.shift();
	}

	public get topCard(): C | undefined {
		return this.cards[0];
	}

	public toArray(): C[] {
		return this.cards.slice();
	}

	public toJSON(): Record<string, unknown> {
		return {
			cardCount: this.cards.length,
		};
	}
}
