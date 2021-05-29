import { createHash } from "crypto";
import { EffectWeightOpsFromType } from "./defaultScores";
import { stableJson } from "./util/stableJson";

export interface SimRunStats {
	lossRate: number;
	lossVariance: number;
	plays: number;
}

export interface SimRun extends Partial<SimRunStats> {
	id: string;
	msToFindNeighbor: number | undefined;
	neighborDepth: number;
	neighborOf: SimRun | undefined;
	neighborSignature: string;
	weights: Partial<EffectWeightOpsFromType>;
}

export type CompletedSimRun = Required<SimRunStats> & SimRun;

export function idForWeights(weights: Partial<EffectWeightOpsFromType>): string {
	return createHash("SHA1")
		.update(stableJson(weights), "utf8")
		.digest("base64")
		.replace(/=+$/, "");
}
