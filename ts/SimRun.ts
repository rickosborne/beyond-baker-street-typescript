import { EffectWeightOpsFromType } from "./defaultScores";

export interface SimRunStats {
	lossRate: number;
	lossVariance: number;
	plays: number;
}

export interface SimRun extends Partial<SimRunStats> {
	weights: Partial<EffectWeightOpsFromType>;
}
