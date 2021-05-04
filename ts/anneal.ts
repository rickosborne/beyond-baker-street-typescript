import { DEFAULT_PRNG, PseudoRNG } from "./rng";

export interface AnnealParams<State> {
	calculateEnergy: (state: State) => number;
	initialState: State;
	neighbor: (state: State, temp: number, prng: PseudoRNG) => State;
	prng: PseudoRNG;
	save: (bestState: State, bestEnergy: number) => void;
	temperature: (temp: number) => number;
	temperatureMax: number;
	temperatureMin: number;
}

export enum AnnealEventType {
	CalculateEnergy = "CalculateEnergy",
	Neighbor = "Neighbor",
}

export interface AnnealEvent {
	annealEventType: AnnealEventType;
}

export interface CalculateEnergyEvent<State> extends AnnealEvent {
	annealEventType: AnnealEventType.CalculateEnergy;
	state: State;
}

export function isCalculateEnergyEvent<T>(maybe: unknown): maybe is CalculateEnergyEvent<T> {
	return (maybe != null) && ((maybe as CalculateEnergyEvent<unknown>).annealEventType === AnnealEventType.CalculateEnergy);
}

export interface NeighborEvent<State> extends AnnealEvent {
	annealEventType: AnnealEventType.Neighbor;
	prng: PseudoRNG;
	state: State;
	temp: number;
}

export function isNeighborEvent<T>(maybe: unknown): maybe is NeighborEvent<T> {
	return (maybe != null) && ((maybe as NeighborEvent<unknown>).annealEventType === AnnealEventType.Neighbor);
}

const ANNEAL_DEFAULTS: Partial<AnnealParams<unknown>> = {
	prng: DEFAULT_PRNG,
	temperature: temp => temp - 1,
	temperatureMax: 100,
	temperatureMin: 1,
};

export function anneal<State>(
	params: Partial<AnnealParams<State>>,
): State {
	const effectiveParams: AnnealParams<State> = Object.assign({}, ANNEAL_DEFAULTS as AnnealParams<State>, params);
	const { calculateEnergy, initialState, neighbor, prng, save, temperature, temperatureMax, temperatureMin } = effectiveParams;
	if (calculateEnergy == null || initialState == null || neighbor == null || prng == null || save == null || temperature == null || temperatureMax == null || temperatureMin == null) {
		throw new Error(`Missing some params:\n${JSON.stringify(params, null, 2)}`);
	}
	let temp: number = temperatureMax;
	let lastState: State = initialState;
	let currentState: State = lastState;
	let bestState: State = lastState;
	let lastEnergy: number = calculateEnergy(initialState);
	let currentEnergy: number = lastEnergy;
	let bestEnergy: number = lastEnergy;
	let count = 0;
	let doSave = false;
	do {
		count++;
		if ((count % 250) === 0) {
			doSave = true;
		}
		currentState = neighbor(lastState, temp, prng);
		currentEnergy = calculateEnergy(currentState);
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
		temp = temperature(temp);
	} while (temp > temperatureMin);
	save(bestState, bestEnergy);
	return bestState;
}
