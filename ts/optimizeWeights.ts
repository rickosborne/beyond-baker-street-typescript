import * as sqlite3 from "better-sqlite3";
import * as os from "os";
import * as process from "process";
import { anneal, AnnealParams, StateAndEnergy } from "./anneal";
import { BOT_TURN_EFFECT_TYPES, BotTurnEffectType } from "./BotTurn";
import {
	EffectWeightOpsFromType,
	formatEffectWeightOpsFromTypeDiff,
	formatOrderedEffectWeightOpsFromType,
} from "./defaultScores";
import { isDefined } from "./defined";
import { EFFECT_WEIGHT_MODIFIERS, EffectWeightModifier } from "./EffectWeight";
import { formatDecimal } from "./formatDecimal";
import { formatLossReasons } from "./formatLossReasons";
import { formatPercent } from "./formatPercent";
import { LossReason } from "./Game";
import { GameSetup, GameWorkerPool } from "./GameWorkerPool";
import { neighborsViaFormulae } from "./neighborsViaFormulae";
import { DEFAULT_PRNG } from "./rng";
import { SimRun } from "./SimRun";
import { stableJson } from "./stableJson";
import { msTimer } from "./timer";
import { PlayGameResult } from "./WorkerTypes";

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
const gameWorkerPool = new GameWorkerPool(isDebug ? 0 : os.cpus().length);
const cheat = true;

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
	const insertAttemptScore = db.prepare<[string, number]>("INSERT OR IGNORE INTO weights_score (weights, score) VALUES (?, ?)");
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
		return allWeights.map(weights => <SelectWeightsScore>{
			score,
			weights,
		});
	};
})(db);

interface SelectAttemptSummary {
	attempts: number;
	best: number;
}

const findAttemptSummary = (db => {
	const selectAttemptSummary = db.prepare("SELECT COUNT(*) as attempts, MIN(score) as best FROM weights_score");
	return function findAttemptSummary(): SelectAttemptSummary | undefined {
		return selectAttemptSummary.get();
	};
})(db);
const iterations = 250;
const IGNORE_TYPES = [ BotTurnEffectType.Win, BotTurnEffectType.Lose ];
const MUTABLE_TYPES = BOT_TURN_EFFECT_TYPES.filter((key: BotTurnEffectType) => !IGNORE_TYPES.includes(key));

function getAttemptSummary(): SelectAttemptSummary {
	return findAttemptSummary() || {
		attempts: 0,
		best: 1,
	};
}

async function calculateEnergy(simRuns: SimRun[]): Promise<StateAndEnergy<SimRun>[]> {
	const setups = simRuns.map(run => {
		const weights = run.weights;
		const attempt = stableJson(weights);
		const lossRate = run.lossRate || scoreForAttempt(attempt);
		const setup: GameSetup = {
			cheat,
			iterations,
			lossRate,
			weights,
		};
		return setup;
	});
	const timer = msTimer();
	const results: PlayGameResult[] = await gameWorkerPool.scoreGames(setups);
	const losses = results.reduce((p, c) => {
		(Object.keys(c.lossReasons) as LossReason[]).forEach(lossReason => {
			p[lossReason] = (p[lossReason] || 0) + (c.lossReasons[lossReason] || 0);
		});
		return p;
	}, {} as Partial<Record<LossReason, number>>);
	console.log(`Processed ${simRuns.length} games in ${Math.round(timer() / 1000)}s${timer() > 0 ? ` = ${formatDecimal(simRuns.length * 1000 / timer(), 2)} games/sec` : ""}.  Losses: ${formatLossReasons(losses, simRuns.length * iterations)}.`);
	return results.filter(isDefined).map(result => {
		if (result.errors !== undefined) {
			console.error(result.errors);
		}
		const weights = result.request.weights;
		const lossRate = result.lossRate as number;
		const attempt = stableJson(weights);
		addAttemptScore(attempt, lossRate);
		return {
			energy: result.lossRate as number,
			state: { weights },
		};
	});
}

const modifiersPlusUndefined: (EffectWeightModifier | undefined)[] = EFFECT_WEIGHT_MODIFIERS.slice();
modifiersPlusUndefined.push(undefined);


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
const initialFromBest = findBestScores().map(sws => <SimRun>{
	lossRate: sws.score,
	weights: sws.weights,
});
const initialState: SimRun[] = initialFromBest.length > 0 ? initialFromBest : [{
	weights: {},
}];
// const initialState: SimRun[] = [
// { weights: { "AssistExactEliminate":[13],"AssistImpossibleType":[-22],"AssistKnown":[8],"AssistNarrow":[14],"AssistNextPlayer":[4],"AssistNotHope":[0],"Confirm":[-20],"ConfirmEventually":[25],"ConfirmNotBaynes":[-15],"ConfirmReady":[ -2, 0, EffectWeightModifier.PlusImpossibleCount ],"EliminateKnownValueUnusedType":[30],"EliminateKnownValueUsedType":[4],"EliminateSetsUpExact":[10],"EliminateStompsExact":[-13],"EliminateUnknownValueUnusedType":[32],"EliminateUnknownValueUsedType":[ 0, -21, EffectWeightModifier.RampUpWithHolmesProgress ],"EliminateWild":[24],"HolmesImpeded":[7],"HolmesProgress":[-20],"ImpossibleAdded":[0],"InvestigateBadOnUnwedged":[-37],"InvestigateBadOnWedged":[-13],"InvestigateCorrectType":[12],"InvestigateCorrectValue":[-1],"InvestigateMaybeBad":[-30],"InvestigatePerfect":[30],"InvestigateUnwedgeWithBad":[30],"InvestigateWild":[-9],"InvestigateWouldWedge":[-42],"InvestigationComplete":[33],"MaybeLose":[-33],"PursueConfirmable":[4],"PursueDuplicate":[36],"PursueImpossible":[18],"PursueMaybe":[-2],"PursuePossible":[-27],"Toby":[5] } },
// { weights: { "AssistExactEliminate":[13],"AssistImpossibleType":[-22],"AssistKnown":[8],"AssistNarrow":[14],"AssistNextPlayer":[4],"AssistNotHope":[0],"Confirm":[-20],"ConfirmEventually":[25],"ConfirmNotBaynes":[-15],"ConfirmReady":[-2],"EliminateKnownValueUnusedType":[30],"EliminateKnownValueUsedType":[4],"EliminateSetsUpExact":[10],"EliminateStompsExact":[-13],"EliminateUnknownValueUnusedType":[32],"EliminateUnknownValueUsedType":[-21],"EliminateWild":[24],"HolmesImpeded":[7],"HolmesProgress":[-20],"ImpossibleAdded":[0],"InvestigateBadOnUnwedged":[-37],"InvestigateBadOnWedged":[-13],"InvestigateCorrectType":[12],"InvestigateCorrectValue":[-1],"InvestigateMaybeBad":[-30],"InvestigatePerfect":[30],"InvestigateUnwedgeWithBad":[30],"InvestigateWild":[-9],"InvestigateWouldWedge":[-42],"InvestigationComplete":[33],"MaybeLose":[-33],"PursueConfirmable":[4],"PursueDuplicate":[36],"PursueImpossible":[18],"PursueMaybe":[-2],"PursuePossible":[-27],"Toby":[5] } },
// { weights: { "AssistExactEliminate":[13],"AssistImpossibleType":[-22],"AssistKnown":[8],"AssistNarrow":[14],"AssistNextPlayer":[4],"AssistNotHope":[0],"Confirm":[-20],"ConfirmEventually":[ 25, 0, EffectWeightModifier.PlusHolmesLocation ],"ConfirmNotBaynes":[-15],"ConfirmReady":[-2],"EliminateKnownValueUnusedType":[30],"EliminateKnownValueUsedType":[4],"EliminateSetsUpExact":[10],"EliminateStompsExact":[-13],"EliminateUnknownValueUnusedType":[32],"EliminateUnknownValueUsedType":[-21],"EliminateWild":[24],"HolmesImpeded":[7],"HolmesProgress":[-20],"ImpossibleAdded":[0],"InvestigateBadOnUnwedged":[-37],"InvestigateBadOnWedged":[-13],"InvestigateCorrectType":[12],"InvestigateCorrectValue":[-1],"InvestigateMaybeBad":[-30],"InvestigatePerfect":[30],"InvestigateUnwedgeWithBad":[30],"InvestigateWild":[-9],"InvestigateWouldWedge":[-42],"InvestigationComplete":[33],"MaybeLose":[-33],"PursueConfirmable":[4],"PursueDuplicate":[36],"PursueImpossible":[18],"PursueMaybe":[-2],"PursuePossible":[-27],"Toby":[5] } },
// { weights: { "AssistExactEliminate":[13],"AssistImpossibleType":[-22],"AssistKnown":[8],"AssistNarrow":[14],"AssistNextPlayer":[4],"AssistNotHope":[0],"Confirm":[-20],"ConfirmEventually":[25],"ConfirmNotBaynes":[-15],"ConfirmReady":[-2],"EliminateKnownValueUnusedType":[30],"EliminateKnownValueUsedType":[4],"EliminateSetsUpExact":[10],"EliminateStompsExact":[-13],"EliminateUnknownValueUnusedType":[32],"EliminateUnknownValueUsedType":[ 0, -21, EffectWeightModifier.RampUpWithHolmesProgress ],"EliminateWild":[24],"HolmesImpeded":[7],"HolmesProgress":[-20],"ImpossibleAdded":[0],"InvestigateBadOnUnwedged":[-37],"InvestigateBadOnWedged":[-13],"InvestigateCorrectType":[12],"InvestigateCorrectValue":[-1],"InvestigateMaybeBad":[-30],"InvestigatePerfect":[30],"InvestigateUnwedgeWithBad":[30],"InvestigateWild":[-9],"InvestigateWouldWedge":[-42],"InvestigationComplete":[33],"MaybeLose":[-33],"PursueConfirmable":[4],"PursueDuplicate":[36],"PursueImpossible":[18],"PursueMaybe":[-2],"PursuePossible":[-27],"Toby":[5] } },
// ];

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
		const annealResult = await anneal(<AnnealParams<SimRun>>{
			calculateEnergy,
			formatState: (simRun, lossRate) => `${formatPercent(lossRate, 2)} ${formatOrderedEffectWeightOpsFromType(simRun.weights)}`,
			improvement,
			initialState: state,
			neighbors: neighborsViaFormulae(MUTABLE_TYPES, EFFECT_WEIGHT_MODIFIERS, scoreForWeights),
			prng: DEFAULT_PRNG,
			temperature: temp => temp - 0.5,
			temperatureMax: TEMP_MAX,
			temperatureMin: TEMP_MIN,
			threadCount: Math.max(1, gameWorkerPool.threadCount),
		});
		state = annealResult.bestStates;
		const elapsed = Date.now() - start;
		const endSummary = getAttemptSummary();
		gameCount = endSummary.attempts - summary.attempts;
		summary = endSummary;
		const rate = gameCount / (elapsed / 1000);
		console.log(`Completed ${summary.attempts} attempts, ${state.length} best${state[0].lossRate != null ? `, ${formatPercent(state[0].lossRate || 1, 2)} loss rate` : ""}, ${formatDecimal(rate, 2)} games/sec, mean ${formatPercent(annealResult.meanEnergy, 2)}, stddev ${formatPercent(annealResult.stddevEnergy, 2)}.`);
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
