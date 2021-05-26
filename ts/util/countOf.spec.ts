import { expect } from "chai";
import { describe, it } from "mocha";
import { strictDeepEqual } from "./strictDeepEqual";
import { countOf } from "./countOf";

describe("countOf", function () {
	it("works for numbers", function () {
		expect(countOf(3, [ 1, 2, 3, 4, 3, 5, 3, 6, 3 ])).equals(4);
	});
	it("works for strings", function () {
		expect(countOf("3", [ 1, 2, 3, 4, 3, 5, 3, 6, 3 ].map(String))).equals(4);
	});
	it("works for objects with a predicate", function () {
		expect(countOf({ a: 3 }, [ { a: 2 }, { a: 3 }, { b: 3 }, { a: 3 } ], strictDeepEqual)).equals(2);
	});
	it("does identity equality by default", function () {
		expect(countOf({ a: 3 }, [ { a: 2 }, { a: 3 }, { b: 3 }, { a: 3 } ])).equals(0);
	});
});
