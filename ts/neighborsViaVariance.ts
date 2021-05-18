import { BotTurnEffectType } from "./BotTurn";
import { EffectWeightOpsFromType } from "./defaultScores";
import { EffectWeightFormula } from "./EffectWeight";
import { randomItem } from "./randomItem";
import { range } from "./range";
import { PseudoRNG } from "./rng";
import { SimRun } from "./SimRun";

export function neighborsViaVariance(
	effectTypes: BotTurnEffectType[],
	scoreFromType: EffectWeightOpsFromType,
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
): (count: number, simRun: SimRun, temp: number, prng: PseudoRNG) => SimRun[] {
	return function neighborsViaVariance(count: number, simRun: SimRun, temp: number, prng: PseudoRNG): SimRun[] {
		const start = Date.now();
		const priorWeights = simRun.weights;
		let variability = Math.floor(temp + 1);
		const results: SimRun[] = [];
		while (variability < 50) {
			variability++;
			const mods = range(-variability, variability);
			mods.push(...mods.map(() => 0));
			for (let comboAttempt = 0; comboAttempt < 250; comboAttempt++) {
				const override: Partial<EffectWeightOpsFromType> = {};
				for (const effectType of effectTypes) {
					const mod = randomItem(mods, prng);
					const existing: EffectWeightFormula = priorWeights[effectType] || scoreFromType[effectType];
					const updated = (existing[0] as number) + mod;
					override[effectType] = [updated];
				}
				const weights = Object.assign({}, priorWeights, override);
				if (scoreForWeights(weights) === undefined) {
					results.push({
						weights,
					});
					// console.log(formatEffectWeightOpsFromTypeDiff(weights, simRun.weights));
					if (results.length >= count) {
						// const endDate = Date.now();
						// console.log(`Took ${endDate - start}ms to find ${results.length}`);
						return results;
					}
				}
			}
		}
		const endDate = Date.now();
		console.log(`Gave up after ${endDate - start}ms to find ${results.length}`);
		return results;
	};
}
