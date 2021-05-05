import * as os from "os";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";

export interface AnnealParams<State> {
	calculateEnergy: (state: State) => Promise<number>;
	initialState: State;
	neighbors: (count: number, state: State, temp: number, prng: PseudoRNG) => State[];
	prng: PseudoRNG;
	save: (bestState: State, bestEnergy: number) => void;
	temperature: (temp: number) => number;
	temperatureMax: number;
	temperatureMin: number;
	threadCount: number;
}

const ANNEAL_DEFAULTS: Partial<AnnealParams<unknown>> = {
	prng: DEFAULT_PRNG,
	temperature: temp => temp - 1,
	temperatureMax: 100,
	temperatureMin: 1,
	threadCount: os.cpus().length,
};

export async function anneal<State>(
	params: Partial<AnnealParams<State>>,
): Promise<State> {
	const effectiveParams: AnnealParams<State> = Object.assign({}, ANNEAL_DEFAULTS as AnnealParams<State>, params);
	const { calculateEnergy, initialState, neighbors, prng, save, temperature, temperatureMax, temperatureMin, threadCount } = effectiveParams;
	if (calculateEnergy == null || initialState == null || neighbors == null || prng == null || save == null || temperature == null || temperatureMax == null || temperatureMin == null || threadCount == null) {
		throw new Error(`Missing some params:\n${JSON.stringify(params, null, 2)}`);
	}
	let temp: number = temperatureMax;
	let lastState: State = initialState;
	let currentState: State = lastState;
	let bestState: State = lastState;
	let lastEnergy: number = await calculateEnergy(initialState);
	let currentEnergy: number = lastEnergy;
	let bestEnergy: number = lastEnergy;
	let count = 0;
	let doSave = false;
	do {
		count++;
		if ((count % 250) === 0) {
			doSave = true;
		}
		const states = neighbors(threadCount, lastState, temp, prng);
		const energies = await Promise.all(states.map(state => calculateEnergy(state)));
		for (let i = 0; i < states.length; i++) {
			currentState = states[i];
			currentEnergy = energies[i];
			if (currentEnergy <= lastEnergy) {
				console.log(`Improvement: ${lastEnergy} > ${currentEnergy}`);
				lastState = currentState;
				lastEnergy = currentEnergy;
				doSave = true;
			} else if (prng() <= Math.exp(0 - ((currentEnergy - lastEnergy) / temp))) {
				// console.log(`Revert to best: ${bestEnergy}`);
				lastState = bestState;
				lastEnergy = bestEnergy;
			}
			// else {
			// 	console.log(`Regression: ${lastEnergy} <= ${currentEnergy}`);
			// }
			if (lastEnergy < bestEnergy) {
				console.log("New best.");
				bestEnergy = lastEnergy;
				bestState = lastState;
				doSave = true;
			}
			if (doSave) {
				save(bestState, bestEnergy);
				doSave = false;
			}
		}
		temp = temperature(temp);
	} while (temp > temperatureMin);
	save(bestState, bestEnergy);
	return bestState;
}
