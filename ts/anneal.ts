import * as os from "os";
import { randomItem } from "./randomItem";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";

export interface AnnealParams<State> {
	calculateEnergy: (state: State) => Promise<number>;
	improvement: (afterState: State, afterEnergy: number, beforeState: State, beforeEnergy: number, temp: number) => void;
	initialState: State[];
	neighbors: (count: number, state: State, temp: number, prng: PseudoRNG) => State[];
	prng: PseudoRNG;
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
): Promise<State[]> {
	const effectiveParams: AnnealParams<State> = Object.assign({}, ANNEAL_DEFAULTS as AnnealParams<State>, params);
	const { calculateEnergy, improvement, initialState, neighbors, prng, temperature, temperatureMax, temperatureMin, threadCount } = effectiveParams;
	if (calculateEnergy == null || improvement == null || initialState == null || neighbors == null || prng == null || temperature == null || temperatureMax == null || temperatureMin == null || threadCount == null) {
		throw new Error(`Missing some params:\n${JSON.stringify(params, null, 2)}`);
	}
	if (initialState.length < 1) {
		throw new Error(`Need at least one initial state`);
	}
	let temp: number = temperatureMax;
	const bestStates: State[] = initialState.slice();
	const lastStates: State[] = initialState.slice();
	let currentState: State = randomItem(initialState);
	let currentEnergy: number = await calculateEnergy(currentState);
	let lastEnergy: number = currentEnergy;
	let bestEnergy: number = currentEnergy;
	do {
		let lastState = randomItem(lastStates);
		const states = neighbors(threadCount, lastState, temp, prng);
		const energies = await Promise.all(states.map(state => calculateEnergy(state)));
		for (let i = 0; i < states.length; i++) {
			currentState = states[i];
			currentEnergy = energies[i];
			if (currentEnergy < lastEnergy && currentState !== lastState) {
				improvement(currentState, currentEnergy, lastState, lastEnergy, temp);
				lastEnergy = currentEnergy;
				lastState = currentState;
				lastStates.splice(0, lastStates.length);
				lastStates.push(currentState);
			} else if (currentEnergy === lastEnergy && currentState !== lastState) {
				lastEnergy = currentEnergy;
				lastState = currentState;
				if (!lastStates.includes(currentState)) {
					lastStates.push(currentState);
				}
			} else if (prng() <= Math.exp(0 - ((currentEnergy - lastEnergy) / temp))) {
				lastEnergy = bestEnergy;
				lastState = randomItem(bestStates);
				lastStates.splice(0, lastStates.length);
				lastStates.push(...bestStates);
			}
			if (lastEnergy < bestEnergy) {
				const bestState = bestStates[0];
				improvement(currentState, currentEnergy, bestState, bestEnergy, temp);
				bestEnergy = currentEnergy;
				bestStates.splice(0, bestStates.length);
				bestStates.push(...lastStates);
				console.log(`Best has ${bestStates.length}`);
			} else if (lastEnergy === bestEnergy && !bestStates.includes(lastState)) {
				bestStates.push(lastState);
				console.log(`Best has ${bestStates.length}`);
			}
		}
		temp = temperature(temp);
	} while (temp > temperatureMin);
	return bestStates;
}
