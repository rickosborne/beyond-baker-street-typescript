import { expect } from "chai";
import { describe, it } from "mocha";
import { parallelMap } from "./parallelMap";

describe("parallelMap", function () {
	it("works", async function () {
		const results: number[] = [];
		await parallelMap(
			[ 1, 3, 5, 7, 9 ][Symbol.iterator](),
			4,
			n => n > 5 ? n * 2 : Promise.resolve(n * 2),
			n => results.push(n),
		);
		expect(results).has.deep.members([ 2, 6, 10, 14, 18 ]);
		expect(results).deep.equals([ 14, 18, 2, 6, 10 ]);
	});
});
