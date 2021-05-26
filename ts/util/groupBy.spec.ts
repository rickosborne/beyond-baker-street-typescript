import { expect } from "chai";
import { describe, it } from "mocha";
import { groupBy } from "./groupBy";

describe("groupBy", function () {
	it("handles duplicates", function () {
		expect(groupBy([ "apple", "banana", "cherry", "durian" ], word => String(word.length)))
			.deep.equals({
			"5": ["apple"],
			"6": [ "banana", "cherry", "durian" ],
		});
	});
});
