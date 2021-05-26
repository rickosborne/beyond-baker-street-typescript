import { expect } from "chai";
import { describe, it } from "mocha";
import { collect } from "./collect";
import { isIterable, isIterator, iteratorMap } from "./iteratorMap";

describe("isIterator", function () {
	it("detects iterator-like things", function () {
		expect(isIterator({ next: () => void(0) })).is.true;
		expect(isIterator([][Symbol.iterator]())).is.true;
	});
	it("rejects non-iterator things", function () {
		expect(isIterator(1234)).is.false;
		expect(isIterator(null)).is.false;
		expect(isIterator(undefined)).is.false;
	});
});

describe("isIterable", function () {
	it("detects iterable things", function () {
		expect(isIterable([])).is.true;
	});
	it("rejects non-iterable things", function () {
		expect(isIterable(1234)).is.false;
		expect(isIterable(null)).is.false;
		expect(isIterable(undefined)).is.false;
	});
});

describe("iteratorMap", function () {
	it("does what it says", function () {
		const iterator = iteratorMap([ 1, 3, 5 ], n => ".".repeat(n));
		const out: string[] = collect(iterator);
		expect(out).deep.equals([ ".", "...", "....." ]);
	});
	it("supports throw", function () {
		const iterator = iteratorMap([ 1, 3, 5 ], n => ".".repeat(n));
		const t = iterator.throw;
		expect(t).is.a("function");
		if (t !== undefined) {
			expect(t(new Error("oops"))).deep.equals({ done: true, value: undefined });
			expect(iterator.next()).deep.equals({ done: true, value: undefined });
		}
	});
	it("checks for null", function () {
		expect(() => iteratorMap(undefined as unknown as Iterator<unknown>, () => "")).throws("iterator or iterable");
	});
	it("supports return", function () {
		const iterator = iteratorMap([ 1, 3, 5 ], n => ".".repeat(n));
		const r = iterator.return;
		expect(r).is.not.undefined;
		if (r !== undefined) {
			expect(r("abc")).deep.equals({ done: true, value: "abc" });
			expect(iterator.next()).deep.equals({ done: true, value: undefined });
		}
	});
});
