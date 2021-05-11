import { expect } from "chai";
import { describe, it } from "mocha";
import { columnarNumber } from "./columnarNumber";

describe("columnarNumber", function () {
	it("12.3 width 5.1", function () {
		expect(columnarNumber(12.3, 5, 1)).equals(" 12.3");
	});
	it("12.3 width 6.1", function () {
		expect(columnarNumber(12.3, 6, 1)).equals("  12.3");
	});
	it("12.3 width 5.2", function () {
		expect(columnarNumber(12.3, 5, 2)).equals("12.3 ");
	});
	it("12.3 width 5.0", function () {
		expect(columnarNumber(12.3, 5, 0)).equals("  12 ");
	});
	it("12 width 5.1", function () {
		expect(columnarNumber(12, 5, 1)).equals(" 12  ");
	});
	it("12 width 5.2", function () {
		expect(columnarNumber(12, 5, 2)).equals("12   ");
	});
	it("12 width 5.0", function () {
		expect(columnarNumber(12, 5, 0)).equals("  12 ");
	});
});
