import { expect } from "chai";
import { describe, it } from "mocha";
import { toRecord } from "./toRecord";

describe("toRecord", function () {
	it("overwrites dupes by default", function () {
		expect(toRecord([ "a", "b", "a" ], k => k, v => v.length)).deep.equals({
			a: 1,
			b: 1,
		});
	});
	it("can handle duplicates", function () {
		expect(toRecord([ "a", "b", "a" ], k => k, (v, index) => `${v}${index}`, (second, first) => `${first}${second}`)).deep.equals({
			a: "a0a2",
			b: "b1",
		});
	});
});
