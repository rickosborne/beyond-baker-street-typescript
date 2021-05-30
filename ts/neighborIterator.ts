import { BotTurnEffectType, MUTABLE_EFFECT_TYPES } from "./BotTurn";
import { DEFAULT_SCORE_FROM_TYPE, EffectWeightOpsFromType } from "./defaultScores";
import { EFFECT_WEIGHT_MODIFIERS, EffectWeightModifier } from "./EffectWeight";
import { fillOutRun } from "./fillOutRun";
import { neighborsViaFormulae } from "./neighborsViaFormulae";
import { neighborsViaRandomChanges } from "./neighborsViaRandomChanges";
import { neighborsViaSwap } from "./neighborsViaSwap";
import { SimRun } from "./SimRun";
import { iteratorRing } from "./util/iteratorRing";
import { msTimer } from "./util/timer";

export function neighborIterator(
	scoreForWeights: (weights: Partial<EffectWeightOpsFromType>) => number | undefined,
	effectTypes: BotTurnEffectType[] = MUTABLE_EFFECT_TYPES,
	modifiers: EffectWeightModifier[] = EFFECT_WEIGHT_MODIFIERS,
	scoreFromType: EffectWeightOpsFromType = DEFAULT_SCORE_FROM_TYPE,
): (simRun: SimRun) => Iterator<SimRun, undefined, number> {
	return function (simRun: SimRun): Iterator<SimRun, undefined, number> {
		const generators: Record<number, Iterator<SimRun, undefined>> = {};
		return {
			next: (temperature: number): IteratorResult<SimRun, undefined> => {
				const timer = msTimer();
				const temp = Math.round(temperature);
				let generator = generators[temp];
				if (generator === undefined) {
					generator = iteratorRing(
						neighborsViaRandomChanges(simRun, temp, scoreForWeights, effectTypes, modifiers, scoreFromType),
						neighborsViaSwap(simRun, temp, scoreForWeights, effectTypes, scoreFromType),
						neighborsViaFormulae(simRun, temp, scoreForWeights, effectTypes, scoreFromType),
					);
					generators[temp] = generator;
				}
				const next = generator.next();
				if (next.value !== undefined) {
					fillOutRun(next.value, simRun, timer);
					return next;
				}
				console.log(`neighborIterator giving up on ${simRun.id}`);
				return { done: true, value: undefined };
			},
		};
	};
}
