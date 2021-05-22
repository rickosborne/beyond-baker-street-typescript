import * as sqlite3 from "better-sqlite3";
import * as process from "process";
import { iteratorMap } from "./arrayIterator";
import { EffectWeightOpsFromType, formatOrderedEffectWeightOpsFromType } from "./defaultScores";
import { EFFECT_WEIGHT_MODIFIERS, EffectWeightModifier } from "./EffectWeight";
import { formatDecimal } from "./formatDecimal";
import { formatPercent } from "./formatPercent";
import { GameSetup, GameWorkerPool } from "./GameWorkerPool";
import { playSingleGame } from "./playSingleGame";
import { SimRun, SimRunStats } from "./SimRun";
import { stableJson } from "./stableJson";
import { Thermocouple } from "./Thermocouple";
import { msTimer } from "./timer";

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
const cheat = process.env.CHEAT === "1";

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
db.exec(`
CREATE TABLE IF NOT EXISTS weights_score (
	weights TEXT NOT NULL PRIMARY KEY,
	score DECIMAL(8,7),
	plays INTEGER,
	variance DECIMAL(8,7)
)
`);

interface SelectWeightsStats {
	plays: number;
	score: number;
	variance: number;
}

interface SelectBestScore extends SelectWeightsStats {
	weights: string;
}

interface BestScore extends SelectWeightsStats {
	weights: EffectWeightOpsFromType;
}

const statsForAttempt = (db => {
	const selectScore = db.prepare<string>("SELECT score, variance, plays, weights FROM weights_score WHERE (weights = ?)");
	return function scoreForAttempt(attempt: string): SelectWeightsStats | undefined {
		return selectScore.get(attempt);
	};
})(db);

function scoreForWeights(weights: Partial<EffectWeightOpsFromType>): number | undefined {
	return statsForAttempt(stableJson(weights))?.score;
}

const addAttemptScore = (db => {
	const insertAttemptScore = db.prepare<[string, number, number, number]>(`
INSERT OR IGNORE INTO weights_score (weights, score, plays, variance)
VALUES (?, ?, ?, ?)
`);
	return function addAttemptScore(attempt: string, score: number, plays: number, variance: number): number {
		return insertAttemptScore.run(attempt, score, plays, variance).changes;
	};
})(db);
const findBestScores: () => BestScore[] = (db => {
	const selectLowestScore = db.prepare("SELECT MIN(score) as s FROM weights_score");
	const selectWeightsByScore = db.prepare<number>("SELECT score, variance, plays, weights FROM weights_score WHERE (score = ?)");
	return function findBestScores(): BestScore[] {
		const score: number = selectLowestScore.get().s;
		return selectWeightsByScore.all(score).map((row: SelectBestScore) => ({
			plays: row.plays,
			score: row.score,
			variance: row.variance,
			weights: JSON.parse(row.weights),
		}));
	};
})(db);

interface SelectAttemptSummary {
	attempts: number;
	bestScore: number;
}

const findAttemptSummary = (db => {
	const selectAttemptSummary = db.prepare("SELECT COUNT(*) as attempts, MIN(score) as bestScore FROM weights_score");
	return function findAttemptSummary(): SelectAttemptSummary | undefined {
		return selectAttemptSummary.get();
	};
})(db);
const iterations = 250;
const modifiersPlusUndefined: (EffectWeightModifier | undefined)[] = EFFECT_WEIGHT_MODIFIERS.slice();
modifiersPlusUndefined.push(undefined);

const initialFromBest: Required<SimRun>[] = findBestScores().map(sws => ({
	lossRate: sws.score,
	lossVariance: sws.variance,
	plays: sws.plays,
	weights: sws.weights,
}));
const initialGame: SimRunStats = initialFromBest.length > 0 ? {
	lossRate: initialFromBest[0].lossRate || 1,
	lossVariance: initialFromBest[0].lossVariance || 1,
	plays: initialFromBest[0].plays || iterations,
} : playSingleGame({}, cheat, iterations);
const initialState: SimRun[] = initialFromBest.length > 0 ? initialFromBest : [{
	lossRate: initialGame.lossRate,
	lossVariance: initialGame.lossVariance,
	plays: initialGame.plays,
	weights: {},
}];

const thermocouple = new Thermocouple(scoreForWeights, 8);
initialState.forEach(state => {
	thermocouple.register(state);
	console.log(`${formatPercent(state.lossRate || 1, 2)} ${formatOrderedEffectWeightOpsFromType(state.weights)}`);
});
let { attempts, bestScore } = findAttemptSummary() || { attempts: 0, bestScore: 1 };
let timer = msTimer();
gameWorkerPool.scoreGames(
	iteratorMap<SimRun, GameSetup, undefined, undefined>(thermocouple, run => ({
		cheat,
		iterations,
		lossRate: run.lossRate,
		lossVariance: run.lossVariance,
		plays: run.plays,
		weights: run.weights,
	})),
	result => {
		addAttemptScore(stableJson(result.request.weights), result.lossRate, result.plays, result.lossVariance);
		const improved = thermocouple.register({
			lossRate: result.lossRate,
			lossVariance: result.lossVariance,
			plays: result.plays,
			weights: result.request.weights,
		});
		if (improved) {
			console.log(`\n${formatPercent(result.lossRate as number, 2)} ${formatPercent(result.lossVariance, 2)}: ${formatOrderedEffectWeightOpsFromType(result.request.weights)}`);
		} else {
			process.stdout.write(result.lossRate === 1 ? "X" : String(Math.floor(result.lossRate * 10)));
		}
		attempts++;
		if (result.lossRate < bestScore) {
			bestScore = result.lossRate;
		}
		if ((attempts % 100) === 0) {
			const ms = timer();
			console.log(`\nRuns: ${attempts} in ${formatDecimal(ms / 1000, 3)}s for ${formatDecimal(1000 * 100 / ms, 2)} runs/s. Scores: ${thermocouple.finished.map(f => formatPercent(f.lossRate, 2)).join(", ")}.`);
			timer = msTimer();
		}
	},
).then(() => {
	console.log("-----");
	for (const state of thermocouple.finished.reverse()) {
		console.log(`${formatPercent(state.lossRate as number, 2)}: ${formatOrderedEffectWeightOpsFromType(state.weights)}`);
	}
	quit(true);
});
