import { expect } from "chai";
import { describe, it } from "mocha";
import { objectMap } from "./objectMap";

describe("objectMap", function () {
	it("does what it says", function () {
		expect(objectMap({
			a: 1,
			b: 2,
			c: 3,
		}, (v, k) => k.repeat(v))).deep.equals({
			a: "a",
			b: "bb",
			c: "ccc",
		});
	});
});
