import { expect } from "chai";
import { describe, it } from "mocha";
import { Pile } from "./Pile";

function buildPile(): Pile<number> {
	const pile = new Pile<number>();
	pile.addToTop(2);
	pile.addToTop(1);
	pile.addToBottom(3);
	return pile;
}

describe("Pile", function () {
	it("toJSON", function () {
		const pile = buildPile();
		expect(pile.toJSON()).deep.equals({
			cardCount: 3,
		});
		pile.addToTop(1);
		expect(pile.toJSON()).deep.equals({
			cardCount: 4,
		});
	});
	it("toArray", function () {
		expect(buildPile().toArray()).deep.equals([ 1, 2, 3 ]);
	});
	it("takeFromTop", function () {
		expect(buildPile().takeFromTop()).equals(1);
	});
	it("swap", function () {
		const pile = buildPile();
		expect(pile.swapOne(4, n => n > 1)).is.true;
		expect(pile.toArray()).deep.equals([ 1, 4, 3 ]);
		expect(pile.swapOne(4, n => n > 5)).is.false;
	});
	it("sum", function () {
		expect(buildPile().sum(n => n)).equals(6);
	});
	it("shuffle", function () {
		const pile = buildPile();
		pile.addToBottom(4);
		pile.addToBottom(5);
		pile.addToBottom(6);
		pile.addToBottom(7);
		pile.shuffle();
		expect(pile.toArray()).deep.includes.members([ 1, 2, 3, 4, 5, 6, 7 ])
			.but.does.not.deep.equal([ 1, 2, 3, 4, 5, 6, 7 ]);
	});
	it("removeIf", function () {
		const pile = buildPile();
		pile.removeIf(n => n > 1);
		expect(pile.toArray()).deep.equals([1]);
	});
	it("empty", function () {
		const pile = buildPile();
		pile.empty();
		expect(pile.toArray()).deep.equals([]);
	});
	it("count", function () {
		expect(buildPile().count).equals(3);
	});
});
