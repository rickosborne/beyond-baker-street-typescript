import * as process from "process";
import { formatEffectWeightOpsFromTypeDiff, formatOrderedEffectWeightOpsFromType } from "./defaultScores";
import { EFFECT_WEIGHT_MODIFIERS, EffectWeightModifier } from "./EffectWeight";
import { formatDecimal } from "./format/formatDecimal";
import { formatPercent } from "./format/formatPercent";
import { GameSetup, GameWorkerPool } from "./GameWorkerPool";
import { playSingleGame } from "./playSingleGame";
import { RunStorage } from "./RunStorage";
import { getOptimizeInstrumentCollector, OptimizeEventType } from "./server/OptimizeInstrument";
import { CompletedSimRun, idForWeights, SimRun, SimRunStats } from "./SimRun";
import { Thermocouple } from "./Thermocouple";
import { iteratorMap } from "./util/iteratorMap";
import { msTimer } from "./util/timer";
import { PlayGameResult } from "./WorkerTypes";

const historyFileName = process.argv[2];
if (historyFileName == null) {
	throw new Error(`Usage: ts-node optimizeWeights.ts "history.json"`);
}

const isDebug = (process.env.NODE_OPTIONS || "").toLowerCase().includes("debug");
const gameWorkerPool = new GameWorkerPool(isDebug ? 0 : 6);
const cheat = process.env.CHEAT === "1";
const iterations = cheat ? 1000 : 250;

process.on("beforeExit", () => gameWorkerPool.shutdown());
process.on("exit", () => gameWorkerPool.shutdown());

const modifiersPlusUndefined: (EffectWeightModifier | undefined)[] = EFFECT_WEIGHT_MODIFIERS.slice();
modifiersPlusUndefined.push(undefined);
const optimizeInstrumentCollector = getOptimizeInstrumentCollector();
const runStorage = new RunStorage(historyFileName);
const thermocouple = new Thermocouple(runStorage, 8);

const initialFromBest: CompletedSimRun[] = runStorage.findBestScores(thermocouple.preferredMaxCount).map(sws => ({
	id: sws.id,
	lossRate: sws.score,
	lossVariance: sws.variance,
	msToFindNeighbor: 0,
	neighborDepth: sws.neighborDepth,
	neighborOf: sws.neighborOf == null ? undefined : {
		id: sws.neighborOf,
		msToFindNeighbor: 0,
		neighborDepth: sws.neighborDepth - 1,
		neighborOf: undefined,
		neighborSignature: "initial",
		weights: runStorage.findWeightsById(sws.neighborOf),
	},
	neighborSignature: sws.neighborSignature,
	plays: sws.plays,
	weights: sws.weights,
}));
const initialGame: SimRunStats = initialFromBest.length > 0 ? {
	lossRate: initialFromBest[0].lossRate || 1,
	lossVariance: initialFromBest[0].lossVariance || 1,
	plays: initialFromBest[0].plays || iterations,
} : playSingleGame({}, cheat, iterations);
const initialState: CompletedSimRun[] = initialFromBest.length > 0 ? initialFromBest : [{
	id: idForWeights({}),
	lossRate: initialGame.lossRate,
	lossVariance: initialGame.lossVariance,
	msToFindNeighbor: 0,
	neighborDepth: 0,
	neighborOf: undefined,
	neighborSignature: "defaults",
	plays: initialGame.plays,
	weights: {},
}];

initialState.forEach(state => {
	thermocouple.register(state);
	console.log(`${formatPercent(state.lossRate || 1, 2)} @${state.neighborDepth} ${formatEffectWeightOpsFromTypeDiff(state.weights)}`);
});
optimizeInstrumentCollector.configChanged({
	config: {
		iterations,
	},
	type: OptimizeEventType.ConfigChanged,
});
let { attempts } = runStorage.findAttemptSummary() || { attempts: 0, bestScore: 1 };
let lastAttempts = attempts;
let iteratorsMs = 0;
let timer = msTimer();
gameWorkerPool.scoreGames(
	iteratorMap<SimRun, GameSetup, undefined, undefined>(thermocouple, run => ({
		cheat,
		id: run.id,
		iterations,
		lossRate: run.lossRate,
		lossVariance: run.lossVariance,
		msToFindNeighbor: run.msToFindNeighbor,
		neighborDepth: run.neighborDepth,
		neighborOf: run.neighborOf,
		neighborSignature: run.neighborSignature,
		plays: run.plays,
		weights: run.weights,
	})),
	(result: PlayGameResult) => {
		const { lossRate, lossVariance, plays, request } = result;
		const { id, msToFindNeighbor, neighborDepth, neighborOf, neighborSignature, weights } = request;
		if (neighborOf?.id == undefined) {
			console.warn(`No neighbor: ${JSON.stringify(result, null, 2)}`);
		}
		const run: CompletedSimRun = {
			id,
			lossRate,
			lossVariance,
			msToFindNeighbor,
			neighborDepth,
			neighborOf,
			neighborSignature,
			plays,
			weights,
		};
		iteratorsMs += (msToFindNeighbor || 0);
		optimizeInstrumentCollector.gameFinished({
			run,
			type: OptimizeEventType.GameFinished,
		});
		const improved = thermocouple.register(run);
		if (improved) {
			console.log(`\n${formatPercent(result.lossRate as number, 2)} ${formatPercent(result.lossVariance, 2)} @${request.neighborDepth} +${request.msToFindNeighbor}ms via ${request.neighborSignature}: ${formatEffectWeightOpsFromTypeDiff(result.request.weights)}`);
			optimizeInstrumentCollector.bestChanged({
				best: thermocouple.finished,
				type: OptimizeEventType.BestChanged,
			});
		} else {
			const rateChar = result.lossRate === 1 ? "X" : String(Math.floor(result.lossRate * 10));
			const sigChar = result.request.neighborSignature[0];
			process.stdout.write(`${rateChar}${sigChar}`);
		}
		attempts++;
		if ((attempts % 100) === 0) {
			const ms = timer();
			const deltaAttempts = attempts - lastAttempts;
			lastAttempts = attempts;
			const secs = ms / 1000;
			const runsPerSec = deltaAttempts / secs;
			console.log(`\nRuns: ${attempts} in ${formatDecimal(secs, 2)}s for ${formatDecimal(runsPerSec, 2)} runs/s, ${iteratorsMs}ms for neighbors. Scores: ${thermocouple.finished.map(f => formatPercent(f.lossRate, 2)).join(", ")}.`);
			iteratorsMs = 0;
			timer = msTimer();
		}
	},
).then(() => {
	console.log("-----");
	for (const state of thermocouple.finished.reverse()) {
		console.log(`${formatPercent(state.lossRate as number, 2)}: ${formatOrderedEffectWeightOpsFromType(state.weights)}`);
	}
	process.exit(0);
});
