import * as sqlite3 from "better-sqlite3";
import * as process from "process";
import { anneal, AnnealParams, NeighborsGenerator } from "./anneal";
import { BotTurnEffectType } from "./BotTurn";
import {
	DEFAULT_SCORE_FROM_TYPE,
	EffectWeightOpsFromType,
	formatEffectWeightOpsFromTypeDiff,
	formatOrderedEffectWeightOpsFromType,
} from "./defaultScores";
import { EffectWeightOp } from "./EffectWeight";
import { formatDecimal } from "./formatDecimal";
import { formatPercent } from "./formatPercent";
import { GameWorkerPool } from "./GameWorkerPool";
import { objectMap } from "./objectMap";
import { randomItem } from "./randomItem";
import { range } from "./range";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { shuffleInPlace } from "./shuffle";
import { stableJson } from "./stableJson";
import { strictDeepEqual } from "./strictDeepEqual";

interface SimRun {
	lossRate?: number;
	weights: Partial<EffectWeightOpsFromType>;
}

const FLAT_SCORE_FROM_TYPE: EffectWeightOpsFromType = {
	[BotTurnEffectType.Win]: [1000],
	[BotTurnEffectType.InvestigatePerfect]: [0],
	[BotTurnEffectType.PursueImpossible]: [0],
	[BotTurnEffectType.AssistExactEliminate]: [0],
	[BotTurnEffectType.PursueDuplicate]: [0],
	[BotTurnEffectType.EliminateKnownUnusedValue]: [0],
	[BotTurnEffectType.EliminateUnusedType]: [0],
	[BotTurnEffectType.AssistKnown]: [0],
	[BotTurnEffectType.InvestigateCorrectType]: [0],
	[BotTurnEffectType.EliminateSetsUpExact]: [0],
	[BotTurnEffectType.Confirm]: [0],
	[BotTurnEffectType.HolmesImpeded]: [0],
	[BotTurnEffectType.AssistImpossibleType]: [0],
	[BotTurnEffectType.AssistNarrow]: [0],
	[BotTurnEffectType.AssistNextPlayer]: [0],

	[BotTurnEffectType.InvestigateCorrectValue]: [0],

	[BotTurnEffectType.ImpossibleAdded]: [0],
	[BotTurnEffectType.EliminateUnknownValue]: [0],
	[BotTurnEffectType.HolmesProgress]: [0],
	[BotTurnEffectType.InvestigateMaybeBad]: [0],
	[BotTurnEffectType.InvestigateWild]: [0],
	[BotTurnEffectType.InvestigateBad]: [0],
	[BotTurnEffectType.EliminateUsedType]: [0],
	[BotTurnEffectType.PursueMaybe]: [0],
	[BotTurnEffectType.EliminateKnownUsedValue]: [0],
	[BotTurnEffectType.EliminateStompsExact]: [0],
	[BotTurnEffectType.EliminateWild]: [0],
	[BotTurnEffectType.MaybeLose]: [0],
	[BotTurnEffectType.PursuePossible]: [0],
	[BotTurnEffectType.Lose]: [-1000],
};
// 90.8% InvestigatePerfect:145 > InvestigateWild:77 > Confirm:75 > PursueImpossible:48 > AssistKnown:46
// > EliminateSetsUpExact:42 > AssistNextPlayer:31 > AssistExactEliminate:25 > EliminateUnusedType:23
// > EliminateUnknownValue:19 > AssistImpossibleType:18 > PursueDuplicate:16 > EliminateStompsExact:15
// > EliminateKnownUnusedValue:10 > HolmesProgress:8 > InvestigateCorrectType:8 > HolmesImpeded:4
// > EliminateUsedType:2 > PursueMaybe:-1 > ImpossibleAdded:-14 > InvestigateMaybeBad:-24
// > InvestigateCorrectValue:-29 > InvestigateBad:-31 > MaybeLose:-47 > AssistNarrow:-49 > EliminateWild:-51
// > EliminateKnownUsedValue:-59 > PursuePossible:-70
// 92.4 InvestigatePerfect:61 > InvestigateWild:48 > InvestigateCorrectType:36 > PursueImpossible:34 > PursueDuplicate:22 > EliminateKnownUnusedValue:19 > AssistExactEliminate:17 > AssistNextPlayer:9 > EliminateUnknownValue:8 > HolmesProgress:8 > InvestigateBad:6 > InvestigateMaybeBad:5 > ImpossibleAdded:4 > EliminateKnownUsedValue:3 > HolmesImpeded:2 > AssistNarrow:2 > AssistKnown:-1 > EliminateSetsUpExact:-1 > Confirm:-1 > InvestigateCorrectValue:-4 > EliminateUnusedType:-10 > EliminateStompsExact:-10 > AssistImpossibleType:-14 > EliminateWild:-21 > PursueMaybe:-23 > MaybeLose:-36 > EliminateUsedType:-41 > PursuePossible:-52
const HANDMADE_FROM_TYPE: EffectWeightOpsFromType = {
	[BotTurnEffectType.Win]: [1000],
	[BotTurnEffectType.InvestigatePerfect]: [20],
	[BotTurnEffectType.PursueImpossible]: [19],
	[BotTurnEffectType.AssistExactEliminate]: [12],
	[BotTurnEffectType.PursueDuplicate]: [11],
	[BotTurnEffectType.EliminateKnownUnusedValue]: [10],
	[BotTurnEffectType.EliminateUnusedType]: [9],
	[BotTurnEffectType.AssistKnown]: [8],
	[BotTurnEffectType.InvestigateCorrectType]: [7],
	[BotTurnEffectType.EliminateSetsUpExact]: [6],
	[BotTurnEffectType.Confirm]: [5],
	[BotTurnEffectType.HolmesImpeded]: [4],
	[BotTurnEffectType.AssistImpossibleType]: [3],
	[BotTurnEffectType.AssistNarrow]: [2],
	[BotTurnEffectType.AssistNextPlayer]: [1],
	[BotTurnEffectType.InvestigateCorrectValue]: [0],
	[BotTurnEffectType.ImpossibleAdded]: [-1],
	[BotTurnEffectType.EliminateUnknownValue]: [-2],
	[BotTurnEffectType.HolmesProgress]: [-3],
	[BotTurnEffectType.InvestigateMaybeBad]: [-4],
	[BotTurnEffectType.InvestigateWild]: [-5],
	[BotTurnEffectType.InvestigateBad]: [-6],
	[BotTurnEffectType.EliminateUsedType]: [-7],
	[BotTurnEffectType.PursueMaybe]: [-8],
	[BotTurnEffectType.EliminateKnownUsedValue]: [-9],
	[BotTurnEffectType.EliminateStompsExact]: [-10],
	[BotTurnEffectType.EliminateWild]: [-11],
	[BotTurnEffectType.MaybeLose]: [-12],
	[BotTurnEffectType.PursuePossible]: [-13],
	[BotTurnEffectType.Lose]: [-1000],
};

const TEMP_MAX = 10;
const TEMP_MIN = 1;

const historyFileName = process.argv[2];
if (historyFileName == null) {
	throw new Error(`Usage: ts-node optimizeWeights.ts "history.json"`);
}
// const historyFileNameJson = `${historyFileName}.json`;
const historyFileNameSqlite = `${historyFileName}.sqlite`;
// const history = fs.existsSync(historyFileNameJson) ? fs.readFileSync(historyFileNameJson, { encoding: "utf8" }) : "{}";
const db = new sqlite3(historyFileNameSqlite);
db.pragma("journal_mode = WAL");
const isDebug = (process.env.NODE_OPTIONS || "").toLowerCase().includes("debug");
const gameWorkerPool = new GameWorkerPool(isDebug ? 0 : 6);
function quit(doExit = true): void {
	console.log(`Closing ${historyFileNameSqlite}`);
	gameWorkerPool.shutdown();
	db.close();
	if (doExit) {
		process.exit();
	}
}
process.on("beforeExit", () => quit(false));
process.on("exit", () => quit(false));
db.exec("CREATE TABLE IF NOT EXISTS weights_score (weights TEXT NOT NULL PRIMARY KEY, score DECIMAL(8,7))");
interface SelectWeightsScore {
	score: number;
	weights: string;
}
const scoreForAttempt = (db => {
	const selectScore = db.prepare<string>("SELECT score FROM weights_score WHERE (weights = ?)");
	return function scoreForAttempt(attempt: string): number | undefined {
		const row: SelectWeightsScore | undefined = selectScore.get(attempt);
		return row?.score;
	};
})(db);
function scoreForWeights(weights: Partial<EffectWeightOpsFromType>): number | undefined {
	return scoreForAttempt(stableJson(weights));
}
const addAttemptScore = (db => {
	const insertAttemptScore = db.prepare<[ string, number ]>("INSERT OR IGNORE INTO weights_score (weights, score) VALUES (?, ?)");
	return function addAttemptScore(attempt: string, score: number): number {
		return insertAttemptScore.run(attempt, score).changes;
	};
})(db);
const findBestScores: () => SelectWeightsScore[] = (db => {
	const selectLowestScore = db.prepare("SELECT MIN(score) as s FROM weights_score");
	const selectWeightsByScore = db.prepare<number>("SELECT weights FROM weights_score WHERE (score = ?)");
	return function findBestScores(): SelectWeightsScore[] {
		const score: number = selectLowestScore.get().s;
		const allWeights: Partial<EffectWeightOpsFromType>[] = selectWeightsByScore.all(score).map(row => JSON.parse(row.weights));
		return allWeights.map(weights => <SelectWeightsScore> {
			score,
			weights,
		});
	};
})(db);
interface SelectAttemptSummary { attempts: number; best: number; }
const findAttemptSummary = (db => {
	const selectAttemptSummary = db.prepare("SELECT COUNT(*) as attempts, MIN(score) as best FROM weights_score");
	return function findAttemptSummary(): SelectAttemptSummary | undefined {
		return selectAttemptSummary.get();
	};
})(db);
const iterations = 250;
const IGNORE_TYPES = [ BotTurnEffectType.Win, BotTurnEffectType.Lose ];
const MUTABLE_TYPES = (Object.keys(FLAT_SCORE_FROM_TYPE) as BotTurnEffectType[])
	.filter((key: BotTurnEffectType) => !IGNORE_TYPES.includes(key));

function getAttemptSummary(): SelectAttemptSummary {
	return findAttemptSummary() || {
		attempts: 0,
		best: 1,
	};
}

async function calculateEnergy(simRun: SimRun): Promise<number> {
	const attempt = stableJson(simRun.weights);
	const existing = scoreForAttempt(attempt);
	if (existing != null) {
		return existing;
	}
	const result = await gameWorkerPool.scoreGame(simRun.weights, iterations);
	const lossRate = result.lossRate;
	// console.log(`${formatPercent(result.lossRate, 2)} ${formatOrderedEffectWeightOpsFromType(simRun.weights)}`);
	simRun.lossRate = lossRate;
	addAttemptScore(attempt, lossRate);
	return lossRate;
}

function neighborsViaVariance(count: number, simRun: SimRun, temp: number, prng: PseudoRNG): SimRun[] {
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
			for (const effectType of MUTABLE_TYPES) {
				const mod = randomItem(mods, prng);
				const existing: EffectWeightOp[] = priorWeights[effectType] || FLAT_SCORE_FROM_TYPE[effectType];
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
}

const neighborsViaSwap = (function (): NeighborsGenerator<SimRun> {
	let previousRun: SimRun;
	const allRuns: SimRun[] = [];
	const maxDistance = 6;
	return function neighborsViaSwap(count: number, simRun: SimRun, temp: number, prng: PseudoRNG): SimRun[] {
		function addRunIfNovel(weights: EffectWeightOpsFromType, ): void {
			if (!strictDeepEqual(weights, simRun.weights) && scoreForWeights(weights) === undefined) {
				allRuns.push({
					weights,
				});
			}
		}
		if (!strictDeepEqual(previousRun, simRun)) {
			previousRun = simRun;
			allRuns.splice(0, allRuns.length);
			const weights: EffectWeightOpsFromType = MUTABLE_TYPES.reduce((w, effectType) => {
				const ops = simRun.weights[effectType] || DEFAULT_SCORE_FROM_TYPE[effectType];
				const base = ops[0];
				w[effectType] = [base];
				return w;
			}, {} as EffectWeightOpsFromType);
			const orderedKeys = (Object.keys(weights) as BotTurnEffectType[]).slice()
				.sort((a, b) => (weights[a][0] as number) - (weights[b][0] as number));
			const keyCount = orderedKeys.length;
			const lastIndex = keyCount - 1;
			addRunIfNovel(objectMap(weights, (ops, type, index) => [Math.floor(lastIndex / 2) - index]));
			const smallest = orderedKeys
				.map(type => weights[type][0] as number)
				.filter(v => v > 0)
				.reduce((p, c) => Math.min(p, c), 1000);
			if (smallest > 1) {
				addRunIfNovel(objectMap(weights, ops => [Math.round((ops[0] as number) / smallest)]));
				addRunIfNovel(objectMap(weights, ops => [(ops[0] as number) - smallest]));
			}
			const rotate = (sourceIndex: number, destIndex: number, weights: EffectWeightOpsFromType): void => {
				const direction = sourceIndex < destIndex ? 1 : -1;
				const first = weights[orderedKeys[sourceIndex]];
				for (let index = sourceIndex; index !== destIndex; index += direction) {
					weights[orderedKeys[index]] = weights[orderedKeys[index + direction]];
				}
				weights[orderedKeys[destIndex]] = first;
			};
			for (let distance = -maxDistance; distance <= maxDistance; distance++) {
				if (distance === 0) {
					continue;
				}
				for (let sourceIndex = 0; sourceIndex < keyCount; sourceIndex++) {
					const destIndex = sourceIndex + distance;
					if (destIndex < 0 || destIndex > lastIndex) {
						continue;
					}
					const farSwap = Object.assign({}, weights);
					const destKey = orderedKeys[destIndex];
					const sourceKey = orderedKeys[sourceIndex];
					[ farSwap[destKey], farSwap[sourceKey] ] = [ farSwap[sourceKey], farSwap[destKey] ];
					addRunIfNovel(farSwap);
					if (!strictDeepEqual(farSwap, simRun.weights) && scoreForWeights(farSwap) === undefined) {
						allRuns.push({ weights: farSwap });
					}
					if (distance > 1) {
						const left = Object.assign({}, weights);
						const right = Object.assign({}, weights);
						rotate(sourceIndex, destIndex, right);
						rotate(destIndex, sourceIndex, left);
						addRunIfNovel(left);
						addRunIfNovel(right);
					}
				}
			}
			console.log(`Swapped neighbors: ${allRuns.length}`);
			shuffleInPlace(allRuns, prng);
		}
		if (allRuns.length === 0) {
			console.log(`Falling back to variance`);
			allRuns.push(...neighborsViaVariance(1000, simRun, temp, prng));
		}
		const runs: SimRun[] = [];
		runs.push(...allRuns.splice(0, count));
		return runs;
	};
})();

function improvement(afterState: SimRun, afterEnergy: number, beforeState: SimRun, beforeEnergy: number, temp: number): void {
	console.log(`${formatPercent(afterEnergy, 2)} < ${formatPercent(beforeEnergy, 2)} :: ${temp} :: ${formatEffectWeightOpsFromTypeDiff(afterState.weights, beforeState.weights)}`);
}

// const initialState: SimRun = bestAttemptWeights != null ? {
// 	lossRate: bestAttemptLossRate,
// 	weights: JSON.parse(bestAttemptWeights),
// } : {
// 	lossRate: 1,
// 	weights: {},
// };
// const initialState = {
// 	lossRate: 1,
// 	weights: Object.assign({}, HANDMADE_FROM_TYPE),
// };
// const initialState: SimRun = {
// 	lossRate: 1,
// 	weights: HANDMADE_FROM_TYPE,
// };
// console.log(`Initial: ${initialState.lossRate == null ? "?" : formatPercent(initialState.lossRate, 2)}: ${formatOrderedEffectWeightOpsFromType(initialState.weights)}`);
const initialState: SimRun[] = findBestScores().map(sws => <SimRun> {
	lossRate: sws.score,
	weights: sws.weights,
});

initialState.forEach(state => {
	console.log(`${formatPercent(state.lossRate || 1, 2)} ${formatOrderedEffectWeightOpsFromType(state.weights)}`);
});

async function optimize(
	initialState: SimRun[]
): Promise<SimRun[]> {
	let state = initialState;
	let summary = getAttemptSummary();
	let gameCount: number;
	console.log(`Starting with ${summary.attempts} attempts, ${state.length} best${state[0].lossRate != null ? `, ${formatPercent(state[0].lossRate || 1, 2)} loss rate` : ""}.`);
	do {
		const start = Date.now();
		state = await anneal(<AnnealParams<SimRun>> {
			calculateEnergy,
			formatState: (simRun, lossRate) => `${formatPercent(lossRate, 2)} ${formatOrderedEffectWeightOpsFromType(simRun.weights)}`,
			improvement,
			initialState: state,
			neighbors: neighborsViaSwap,
			prng: DEFAULT_PRNG,
			temperature: temp => temp - 0.5,
			temperatureMax: TEMP_MAX,
			temperatureMin: TEMP_MIN,
			threadCount: Math.max(1, gameWorkerPool.threadCount),
		});
		const elapsed = Date.now() - start;
		const endSummary = getAttemptSummary();
		gameCount = endSummary.attempts - summary.attempts;
		summary = endSummary;
		const rate = gameCount / (elapsed / 1000);
		console.log(`Completed ${summary.attempts} attempts, ${state.length} best${state[0].lossRate != null ? `, ${formatPercent(state[0].lossRate || 1, 2)} loss rate` : ""}, ${formatDecimal(rate, 2)} games/sec.`);
	} while (gameCount > 0);
	return state;
}

optimize(initialState).then(states => {
	console.log("-----");
	for (const state of states) {
		console.log(`${formatPercent(state.lossRate as number, 2)}: ${formatOrderedEffectWeightOpsFromType(state.weights)}`);
	}
	quit(true);
});
