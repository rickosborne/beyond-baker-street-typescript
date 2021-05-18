import { EffectWeightOpsFromType } from "./defaultScores";

export interface SimRun {
	lossRate?: number;
	weights: Partial<EffectWeightOpsFromType>;
}
