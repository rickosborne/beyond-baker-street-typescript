import { describe, it } from "mocha";
import { expect } from "chai";
import { stableJson } from "./stableJson";

describe("stableJson", function () {
	it("works", function () {
		const a: Record<string, unknown> = { q: 1 };
		a.r = [ true, false ];
		const b: Record<string, unknown> = { r: [ true, false ] };
		b.q = 1;
		const c: Record<string, unknown> = { q: 1, r: [ true, false ] };
		expect(stableJson(a)).equals(stableJson(b));
		expect(stableJson(a)).equals(stableJson(c));
	});
});
