import { expect } from "chai";
import { describe, it } from "mocha";
import { anneal, AnnealParams } from "./anneal";

function params(partial: Partial<AnnealParams<string>>): AnnealParams<string> {
	return Object.assign(<AnnealParams<string>> {
		calculateEnergy: () => {
			throw new Error(`No default calculateEnergy`);
		},
		formatState: state => state,
		improvement: () => void (0),
		initialState: ["initial"],
		neighbors: (count, state) => {
			expect(count).equals(1);
			expect(state).equals("initial");
			return ["neighbor"];
		},
		prng: () => 0,
		temperature: t => t - 1,
		temperatureMax: 1,
		temperatureMin: 0,
		threadCount: 1,
	}, partial);
}

describe("anneal", function () {
	it("follows a lower temp", async function () {
		const annealParams: AnnealParams<string> = params({
			calculateEnergy: state => {
				expect([ "initial", "neighbor" ]).includes(state);
				return Promise.resolve(state === "initial" ? 5 : 4);
			},
		});
		const best = await anneal(annealParams);
		expect(best).deep.equals(["neighbor"]);
	});

	it("does not follow a higher temp", async function () {
		const annealParams: AnnealParams<string> = params({
			calculateEnergy: state => {
				expect([ "initial", "neighbor" ]).includes(state);
				return Promise.resolve(state === "initial" ? 4 : 5);
			},
		});
		const best = await anneal(annealParams);
		expect(best).deep.equals(["initial"]);
	});

	it("keeps multiple best", async function () {
		const annealParams: AnnealParams<string> = params({
			calculateEnergy: state => {
				expect([ "initial", "neighbor" ]).includes(state);
				return Promise.resolve(2);
			},
		});
		const best = await anneal(annealParams);
		expect(best).deep.equals([ "initial", "neighbor" ]);
	});
});
