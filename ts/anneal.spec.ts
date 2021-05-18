import { expect } from "chai";
import { describe, it } from "mocha";
import { anneal, AnnealParams, StateAndEnergy } from "./anneal";

function params(partial: Partial<AnnealParams<string>>): AnnealParams<string> {
	return Object.assign(<AnnealParams<string>>{
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
			calculateEnergy: (states): Promise<StateAndEnergy<string>[]> => {
				states.forEach(state => expect([ "initial", "neighbor" ]).includes(state));
				return Promise.resolve(states.map(state => state === "initial" ? {
					energy: 5,
					state,
				} : {
					energy: 4,
					state,
				}));
			},
		});
		const best = await anneal(annealParams);
		expect(best.bestStates).deep.equals(["neighbor"]);
	});

	it("does not follow a higher temp", async function () {
		const annealParams: AnnealParams<string> = params({
			calculateEnergy: (states): Promise<StateAndEnergy<string>[]> => {
				states.forEach(state => expect([ "initial", "neighbor" ]).includes(state));
				return Promise.resolve(states.map(state => state === "initial" ? {
					energy: 4,
					state,
				} : {
					energy: 5,
					state,
				}));
			},
		});
		const best = await anneal(annealParams);
		expect(best.bestStates).deep.equals(["initial"]);
	});

	it("keeps multiple best", async function () {
		const annealParams: AnnealParams<string> = params({
			calculateEnergy: (states): Promise<StateAndEnergy<string>[]> => {
				states.forEach(state => expect([ "initial", "neighbor" ]).includes(state));
				return Promise.resolve(states.map(state => ({
					energy: 2,
					state,
				})));
			},
		});
		const best = await anneal(annealParams);
		expect(best.bestStates).deep.equals([ "initial", "neighbor" ]);
	});
});
