import { BotTurnEffectType } from "./BotTurn";
import { DEFAULT_SCORE_FROM_TYPE, EffectWeightOpsFromType } from "./defaultScores";
import { EffectWeightFormula, EffectWeightModifier } from "./EffectWeight";
import { objectMap } from "./objectMap";
import { randomItem } from "./randomItem";
import { PseudoRNG, randomInt } from "./rng";
import { SimRun } from "./SimRun";
import { strictDeepEqual } from "./strictDeepEqual";

export function neighborsViaFormulae(
	effectTypes: BotTurnEffectType[],
	modifiers: EffectWeightModifier[],
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
): (count: number, state: SimRun, temp: number, prng: PseudoRNG) => SimRun[] {
	const modifiersPlusUndefined: (EffectWeightModifier | undefined)[] = modifiers.slice();
	modifiersPlusUndefined.push(undefined);
	return function neighborsViaFormulae(count: number, state: SimRun, temp: number, prng: PseudoRNG): SimRun[] {
		const result: SimRun[] = [];
		const addIfNovel = (weights: Partial<EffectWeightOpsFromType>): void => {
			if (!strictDeepEqual(weights, state.weights) && scoreForWeights(weights) === undefined && result.find(r => strictDeepEqual(r, weights)) === undefined) {
				result.push(<SimRun>{ weights });
			}
		};
		for (let attempts = 0; attempts < count; attempts++) {
			for (let effectsToModify = 1; effectsToModify <= Math.ceil(temp / 2); effectsToModify++) {
				const weights: Partial<EffectWeightOpsFromType> = {};
				for (let effectNum = 0; effectNum < effectsToModify; effectNum++) {
					const effectType = randomItem(effectTypes, prng);
					let weight = state.weights[effectType];
					if (weight == null) {
						weight = DEFAULT_SCORE_FROM_TYPE[effectType];
					}
					const [ base, offset, modifier ] = weight;
					const updatedModifier = randomItem(modifiersPlusUndefined, prng);
					const baseDelta = randomInt(-temp, temp, prng);
					const effectiveModifier = updatedModifier || modifier;
					if (effectiveModifier === undefined) {
						weights[effectType] = [base + baseDelta];
					} else {
						const offsetDelta = randomInt(-temp, temp, prng);
						const effectiveOffset = offsetDelta + (offset === undefined ? 0 : offset);
						weights[effectType] = [ base + baseDelta, effectiveOffset, effectiveModifier ];
					}
				}
				for (let fuzz = -20; fuzz <= 20; fuzz++) {
					const fuzzed = objectMap(weights as EffectWeightOpsFromType, (v: EffectWeightFormula) => {
						const formula = v.slice() as EffectWeightFormula;
						if (formula[1] !== undefined) {
							formula[1] += fuzz;
						}
						return formula;
					});
					addIfNovel(fuzzed);
					const swapped = objectMap(fuzzed as EffectWeightOpsFromType, (v: EffectWeightFormula) => {
						return v.length === 1 ? v : [ v[1], v[0], v[2] ] as EffectWeightFormula;
					});
					addIfNovel(swapped);
				}
			}
			if (result.length >= count) {
				return result;
			}
		}
		return result;
	};
}
