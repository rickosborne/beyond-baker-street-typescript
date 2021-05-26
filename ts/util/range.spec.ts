import { expect } from "chai";
import { describe, it } from "mocha";
import { range } from "./range";

describe("range", function () {
	it("handles single-value", function () {
		expect(range(0, 0)).deep.equals([0]);
		expect(range(1, 1)).deep.equals([1]);
		expect(range(-2, -2)).deep.equals([-2]);
	});

	it("handles reverse", function () {
		expect(range(1, -1)).deep.equals([ 1, 0, -1 ]);
		expect(range(-2, -5)).deep.equals([ -2, -3, -4, -5 ]);
	});

	it ("handles multi-value", function () {
		expect(range(2, 3)).deep.equals([ 2, 3 ]);
		expect(range(3, 5)).deep.equals([ 3, 4, 5 ]);
		expect(range(-2, 1)).deep.equals([ -2, -1, 0, 1 ]);
	});
});
