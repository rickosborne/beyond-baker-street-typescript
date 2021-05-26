import { describe, it } from "mocha";
import { expect } from "chai";
import { unique, uniqueReducer } from "./unique";

describe("unique", function () {
	it("works for anything", function () {
		const obj = { c: 3 };
		expect(unique([
			"a", 2, obj, true,
			true, obj, 2, "a",
		])).deep.equals([
			"a", 2, obj, true,
		]);
	});

	it("reduces uniquely", function () {
		const obj = { c: 3 };
		expect([
			"a", 2, obj, true,
			true, obj, 2, "a",
		].reduce(uniqueReducer, [] as unknown[])).deep.equals([
			"a", 2, obj, true,
		]);
	});
});
