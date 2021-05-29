import { isEffectWeightOpsFromType } from "./defaultScores";
import { LossReason } from "./Game";
import { SimRun } from "./SimRun";
import { isNumber } from "./util/isNumber";

export interface PlayGameRequest extends SimRun {
	readonly cheat: boolean;
	readonly iterations?: number;
	readonly sequenceId: number;
}

export function isPlayGameRequest(maybe: unknown): maybe is PlayGameRequest {
	const pgr = maybe as PlayGameRequest;
	return (pgr != null) && isEffectWeightOpsFromType(pgr.weights);
}

export interface PlayGameResult {
	readonly errors: string | undefined;
	readonly lossRate: number;
	readonly lossReasons: Partial<Record<LossReason, number>>;
	readonly lossVariance: number;
	readonly plays: number;
	readonly request: PlayGameRequest;
}

export function isPlayGameResult(maybe: unknown): maybe is PlayGameResult {
	const pgr = maybe as PlayGameResult;
	// noinspection SuspiciousTypeOfGuard
	return (pgr != null) && isPlayGameRequest(pgr.request)
		&& (pgr.lossRate === undefined || isNumber(pgr.lossRate))
		&& (pgr.errors === undefined || (typeof pgr.errors === "string"));
}
