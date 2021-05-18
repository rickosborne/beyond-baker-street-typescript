import * as os from "os";
import { mean, stddev } from "./arrayMath";
import { randomItem } from "./randomItem";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { strictDeepEqual } from "./strictDeepEqual";

export type NeighborsGenerator<State> = (count: number, state: State, temp: number, prng: PseudoRNG) => State[];

export interface StateAndEnergy<State> {
	energy: number;
	state: State;
}

export interface AnnealParams<State> {
	calculateEnergy: (states: State[]) => Promise<StateAndEnergy<State>[]>;
	formatState: (state: State, energy: number) => string,
	improvement: (afterState: State, afterEnergy: number, beforeState: State, beforeEnergy: number, temp: number) => void;
	initialState: State[];
	neighbors: NeighborsGenerator<State>;
	prng: PseudoRNG;
	temperature: (temp: number) => number;
	temperatureMax: number;
	temperatureMin: number;
	threadCount: number;
}

export interface AnnealResult<State> {
	bestEnergy: number;
	bestStates: State[];
	iterations: number;
	meanEnergy: number;
	stddevEnergy: number;
}

// istanbul ignore next
const ANNEAL_DEFAULTS: Partial<AnnealParams<unknown>> = {
	prng: DEFAULT_PRNG,
	temperature: temp => temp - 1,
	temperatureMax: 100,
	temperatureMin: 1,
	threadCount: os.cpus().length,
};

export async function anneal<State>(
	params: Partial<AnnealParams<State>>,
): Promise<AnnealResult<State>> {
	const effectiveParams: AnnealParams<State> = Object.assign({}, ANNEAL_DEFAULTS as AnnealParams<State>, params);
	const {
		calculateEnergy,
		formatState,
		improvement,
		initialState,
		neighbors,
		prng,
		temperature,
		temperatureMax,
		temperatureMin,
		threadCount,
	} = effectiveParams;
	/* istanbul ignore if */
	if (calculateEnergy == null || formatState == null || improvement == null || initialState == null || neighbors == null || prng == null || temperature == null || temperatureMax == null || temperatureMin == null || threadCount == null) {
		throw new Error(`Missing some params:\n${JSON.stringify(params, null, 2)}`);
	}
	/* istanbul ignore if */
	if (initialState.length < 1) {
		throw new Error(`Need at least one initial state`);
	}
	let temp: number = temperatureMax;
	const bestStates: State[] = initialState.slice();
	const lastStates: State[] = initialState.slice();
	const initialEnergies = await calculateEnergy(initialState);
	if (initialEnergies.length < 1) {
		throw new Error(`None of the initial states returned an energy`);
	}
	const initialBest = initialEnergies.reduce((p, c) => {
		return c.energy < p.energy ? c : p;
	});
	let currentEnergy = initialBest.energy;
	let currentState = initialBest.state;
	/* istanbul ignore if */
	if (currentEnergy == null) {
		throw new Error(`Initial energy cannot be null.`);
	}
	let lastEnergy: number = currentEnergy;
	let bestEnergy: number = currentEnergy;
	let states: State[];
	const allEnergies: number[] = [];
	do {
		let lastState = randomItem(lastStates);
		states = neighbors(threadCount, lastState, temp, prng);
		const statesAndEnergies = await calculateEnergy(states);
		for (let i = 0; i < statesAndEnergies.length; i++) {
			currentState = statesAndEnergies[i].state;
			currentEnergy = statesAndEnergies[i].energy;
			allEnergies.push(currentEnergy);
			/* istanbul ignore if */
			if (strictDeepEqual(lastState, currentState)) {
				throw new Error(`Equal states: ${formatState(lastState, lastEnergy)}`);
			}
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
				improvement(lastState, lastEnergy, bestState, bestEnergy, temp);
				bestEnergy = lastEnergy;
				bestStates.splice(0, bestStates.length);
				bestStates.push(...lastStates);
				// console.log(`Best has ${bestStates.length}`);
			} else if (lastEnergy === bestEnergy && !bestStates.includes(lastState)) {
				bestStates.push(lastState);
				// console.log(`Best has ${bestStates.length}: ${formatState(lastState, lastEnergy)}`);
			}
		}
		temp = temperature(temp);
	} while (temp > temperatureMin && states.length > 0);
	const avg = mean(allEnergies);
	const sd = stddev(allEnergies, avg);
	return {
		bestEnergy,
		bestStates,
		iterations: allEnergies.length,
		meanEnergy: avg,
		stddevEnergy: sd,
	};
}
