import * as sqlite3 from "better-sqlite3";
import * as process from "process";
import { anneal, AnnealParams } from "./anneal";
import { Bot } from "./Bot";
import { BotTurnEffectType } from "./BotTurn";
import { CASE_FILE_CARDS } from "./CaseFileCard";
import { EffectWeightOpsFromType, formatOrderedEffectWeightOpsFromType } from "./defaultScores";
import { EffectWeightOp } from "./EffectWeight";
import { formatPercent } from "./formatPercent";
import { Game, GameState } from "./Game";
import { SILENT_LOGGER } from "./logger";
import { randomItem } from "./randomItem";
import { range } from "./range";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { stableJson } from "./stableJson";

interface SimRun {
	lossRate?: number;
	weights: Partial<EffectWeightOpsFromType>;
}

const FLAT_SCORE_FROM_TYPE: EffectWeightOpsFromType = {
	[BotTurnEffectType.Win]: [100],
	[BotTurnEffectType.InvestigatePerfect]: [0],
	[BotTurnEffectType.PursueImpossible]: [0],
	[BotTurnEffectType.AssistExactEliminate]: [40],
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

const TEMP_MAX = 30;
const TEMP_MIN = 10;

const historyFileName = process.argv[2];
if (historyFileName == null) {
	throw new Error(`Usage: ts-node optimizeWeights.ts "history.json"`);
}
// const historyFileNameJson = `${historyFileName}.json`;
const historyFileNameSqlite = `${historyFileName}.sqlite`;
// const history = fs.existsSync(historyFileNameJson) ? fs.readFileSync(historyFileNameJson, { encoding: "utf8" }) : "{}";
const db = new sqlite3(historyFileNameSqlite);
db.pragma("journal_mode = WAL");
function quit(): void {
	console.log(`Closing ${historyFileNameSqlite}`);
	db.close();
	process.exit();
}
process.on("exit", quit);
process.on("SIGHUP", quit);
process.on("SIGINT", quit);
process.on("SIGTERM", quit);
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
const addAttemptScore = (db => {
	const insertAttemptScore = db.prepare<[ string, number ]>("INSERT OR IGNORE INTO weights_score (weights, score) VALUES (?, ?)");
	return function addAttemptScore(attempt: string, score: number): number {
		return insertAttemptScore.run(attempt, score).changes;
	};
})(db);
const findBestScore = (db => {
	const selectLowestScore = db.prepare("SELECT weights, score FROM weights_score ORDER BY score LIMIT 1");
	return function findBestScore(): SelectWeightsScore | undefined {
		return selectLowestScore.get();
	};
})(db);
interface SelectAttemptSummary { attempts: number; best: number; }
const findAttemptSummary = (db => {
	const selectAttemptSummary = db.prepare("SELECT COUNT(*) as attempts, MIN(score) as best FROM weights_score");
	return function findAttemptSummary(): SelectAttemptSummary | undefined {
		return selectAttemptSummary.get();
	};
})(db);
const bestAttemptFromDB: SelectWeightsScore | undefined = findBestScore();
const bestAttemptWeights: string | undefined = bestAttemptFromDB?.weights;
const bestAttemptLossRate: number | undefined = bestAttemptFromDB?.score;
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

function calculateEnergy(simRun: SimRun): number {
	if (simRun.lossRate !== undefined) {
		return simRun.lossRate;
	}
	let losses = 0;
	for (let i = 0; i < iterations; i++) {
		const game = new Game(CASE_FILE_CARDS[0], range(1, 4)
			.map(() => new Bot(SILENT_LOGGER, DEFAULT_PRNG, simRun.weights)));
		while (game.state === GameState.Playing) {
			game.step();
		}
		if (game.state === GameState.Lost) {
			losses++;
		}
	}
	const lossRate = losses / iterations;
	simRun.lossRate = lossRate;
	const attempt = stableJson(simRun.weights);
	addAttemptScore(attempt, lossRate);
	return lossRate;
}

function save(bestState: SimRun, bestEnergy: number): void {
	// fs.writeFileSync(historyFileNameJson, stableJson(attempts, "\t"), { encoding: "utf8" });
	if (typeof db.checkpoint === "function") {
		db.checkpoint();
	}
	const summary = getAttemptSummary();
	console.log(`Saved ${summary.attempts} :: ${formatPercent(bestEnergy, 2)} :: ${formatOrderedEffectWeightOpsFromType(bestState.weights)}`);
}

function neighbor(simRun: SimRun, temp: number, prng: PseudoRNG): SimRun {
	const priorWeights = simRun.weights;
	let variability = Math.floor(temp + 1);
	while (variability < 50) {
		variability++;
		const mods = range(-variability, variability);
		for (let comboAttempt = 0; comboAttempt < 250; comboAttempt++) {
			const override: Partial<EffectWeightOpsFromType> = {};
			for (const effectType of MUTABLE_TYPES) {
				const mod = randomItem(mods, prng);
				const existing: EffectWeightOp[] = priorWeights[effectType] || FLAT_SCORE_FROM_TYPE[effectType];
				const updated = (existing[0] as number) + mod;
				override[effectType] = [updated];
			}
			const weights = Object.assign({}, priorWeights, override);
			const json = stableJson(weights);
			const already = scoreForAttempt(json);
			if (already === undefined) {
				return {
					weights,
				};
			}
		}
	}
	throw new Error(`Could not find anything to modify`);
}

const initialState: SimRun = bestAttemptWeights != null ? {
	lossRate: bestAttemptLossRate,
	weights: JSON.parse(bestAttemptWeights),
} : {
	lossRate: 1,
	weights: {},
};
console.log(`Initial: ${formatPercent(initialState.lossRate as number, 2)}: ${formatOrderedEffectWeightOpsFromType(initialState.weights)}`);

let state = initialState;

while (state.lossRate === undefined || state.lossRate > 0.8) {
	const summary = getAttemptSummary();
	console.log(`Starting with ${summary.attempts} attempts and a loss rate of ${formatPercent(state.lossRate || 1, 2)}.`);
	state = anneal(<AnnealParams<SimRun>> {
		calculateEnergy,
		initialState: state,
		neighbor,
		prng: DEFAULT_PRNG,
		save,
		temperature: temp => temp - 0.1,
		temperatureMax: TEMP_MAX,
		temperatureMin: TEMP_MIN,
	});
}

console.log("-----");
console.log(`${formatPercent(state.lossRate as number, 2)}: ${formatOrderedEffectWeightOpsFromType(state.weights)}`);

