import { range } from "./range";
import { shuffleInPlace } from "./shuffle";
import { pairedPermutations2 } from "./pairedPermutations";

export function* shufflingPairIterator<A, B>(aItems: A[], bItems: B[]): IterableIterator<[A, B]> {
	if (aItems.length === 0 || bItems.length === 0) {
		return;
	}
	for (const [ a, b ] of shuffleInPlace(pairedPermutations2(range(0, aItems.length - 1), range(0, bItems.length - 1)))) {
		yield [ aItems[a], bItems[b] ];
	}
}
