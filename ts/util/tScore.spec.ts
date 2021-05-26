import { expect } from "chai";
import { describe, it } from "mocha";
import { tScore } from "./tScore";
import { withinDecimals } from "./withinDecimals";

describe("tScore", function () {
	([
		[ 499, 0.05, 1.648 ],
		[ 499, 0.025, 1.965 ],
		[ 499, 0.01, 2.334 ],
		[ 249, 0.05, 1.651 ],
	] as [number, number, number][]).forEach(([ df, alpha, score ]) => {
		it(`returns exact ${score} for df ${df} and alpha ${alpha}`, function () {
			expect(tScore(df, alpha)).equals(score);
		});
	});

	describe("close enough", function () {
		([
			[ 498, 0.05, 1.648, 3 ],
			[ 300, 0.05, 1.650, 3 ],
			[ 1300, 0.05, 1.645, 3 ],
		] as [number, number, number, number][]).forEach(([ df, alpha, score, decimals ]) => {
			it(`returns close enough ${score} within ${decimals} for df ${df} and alpha ${alpha}`, function () {
				const actual = tScore(df, alpha, false);
				expect(withinDecimals(actual, score, decimals), `${actual}`).is.true;
			});
		});
	});

	it("throws when the alpha is not found", function () {
		expect(() => tScore(19, 0.25)).throws("Alpha not present");
	});
});
