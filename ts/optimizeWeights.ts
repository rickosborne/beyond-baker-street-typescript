import * as fs from "fs";
import * as process from "process";
import { anneal, AnnealParams } from "./anneal";
import { Bot } from "./Bot";
import { BotTurnEffectType } from "./BotTurn";
import { CASE_FILE_CARDS } from "./CaseFileCard";
import { EffectWeightOpsFromType } from "./defaultScores";
import { EffectWeightOp } from "./EffectWeight";
import { formatPercent } from "./formatPercent";
import { Game, GameState } from "./Game";
import { randomItem } from "./randomItem";
import { range } from "./range";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { stableJson } from "./stableJson";

interface SimRun {
	attempts: Record<string, number>;
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
const history = fs.existsSync(historyFileName) ? fs.readFileSync(historyFileName, { encoding: "utf8" }) : "{}";
const iterations = 250;
const attempts: Record<string, number> = JSON.parse(history);
const IGNORE_TYPES = [ BotTurnEffectType.Win, BotTurnEffectType.Lose ];
const MUTABLE_TYPES = (Object.keys(FLAT_SCORE_FROM_TYPE) as BotTurnEffectType[])
	.filter((key: BotTurnEffectType) => !IGNORE_TYPES.includes(key));
const bestAttemptWeights: string | undefined = Object.keys(attempts)
	.sort((a, b) => attempts[a] - attempts[b])[0];
const initialState: SimRun = bestAttemptWeights != null ? {
	attempts,
	lossRate: attempts[bestAttemptWeights],
	weights: JSON.parse(bestAttemptWeights),
} : {
	attempts,
	lossRate: 1,
	weights: {},
};
console.log(`Initial: ${formatPercent(initialState.lossRate as number, 2)}: ${stableJson(initialState.weights, 2)}`);

function calculateEnergy(simRun: SimRun): number {
	if (simRun.lossRate !== undefined) {
		return simRun.lossRate;
	}
	let losses = 0;
	for (let i = 0; i < iterations; i++) {
		const game = new Game(CASE_FILE_CARDS[0], range(1, 4).map(() => new Bot()));
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
	attempts[attempt] = lossRate;
	// console.log(`${formatPercent(lossRate, 2)}: ${attempt}`);
	// console.log(`${formatPercent(lossRate, 2)}`);
	return lossRate;
}

function save(bestState: SimRun, bestEnergy: number): void {
	fs.writeFileSync(historyFileName, stableJson(attempts, "\t"), { encoding: "utf8" });
	console.log(`Saved ${Object.keys(attempts).length} :: ${formatPercent(bestEnergy, 2)} :: ${JSON.stringify(bestState.weights)}`);
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
			const already = attempts[json];
			if (already == null) {
				return {
					attempts,
					weights,
				};
			}
		}
	}
	throw new Error(`Could not find anything to modify`);
}

let state = initialState;

while (state.lossRate === undefined || state.lossRate > 0.8) {
	console.log(`Starting with ${Object.keys(attempts).length} attempts and a loss rate of ${formatPercent(state.lossRate || 1, 2)}.`);
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
console.log(`${formatPercent(state.lossRate as number, 2)}: ${stableJson(state.weights, 2)}`);
