import * as sqlite3 from "better-sqlite3";
import * as process from "process";
import { EffectWeightOpsFromType } from "./defaultScores";
import { isDefined } from "./util/defined";
import { stableJson } from "./util/stableJson";

export interface SelectWeightsStats {
	plays: number;
	score: number;
	variance: number;
}

export interface SelectBestScore extends SelectWeightsStats {
	depth: number;
	id: string;
	neighbor?: string | undefined;
	weights: string;
}

export interface BestScore extends SelectWeightsStats {
	id: string;
	neighborDepth: number;
	neighborOf?: string | undefined;
	neighborSignature: string;
	weights: EffectWeightOpsFromType;
}

export interface SelectAttemptSummary {
	attempts: number;
	bestScore: number;
}

export class RunStorage {
	private readonly db: sqlite3.Database;
	private readonly insertAttemptScore: sqlite3.Statement<[string, string, number, number, number, (string | undefined), number]>;
	private readonly selectAttemptSummary: sqlite3.Statement<[]>;
	private readonly selectScore: sqlite3.Statement<[string]>;
	private readonly selectWeightsById: sqlite3.Statement<[string]>;
	private readonly selectWeightsByScore: sqlite3.Statement<[number]>;

	constructor(
		public readonly historyFileName: string,
	) {
		const historyFileNameSqlite = `${historyFileName}.sqlite`;
		this.db = new sqlite3(historyFileNameSqlite);
		function quit(doExit = true, db: sqlite3.Database): void {
			console.log(`Closing ${historyFileNameSqlite}`);
			db.close();
			if (doExit) {
				process.exit();
			}
		}
		process.on("beforeExit", () => quit(false, this.db));
		process.on("exit", () => quit(false, this.db));
		this.db.pragma("journal_mode = WAL");
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS weights_score (
				id CHAR(27) NOT NULL PRIMARY KEY,
				weights TEXT NOT NULL,
				score DECIMAL(8,7) NOT NULL,
				plays INTEGER NOT NULL,
				variance DECIMAL(8,7) NOT NULL,
				neighbor CHAR(27) NULL,
				depth INTEGER NOT NULL,
				UNIQUE (weights) ON CONFLICT IGNORE
			)
		`);
		this.selectAttemptSummary = this.db.prepare("SELECT COUNT(*) as attempts, MIN(score) as bestScore FROM weights_score");
		this.selectScore = this.db.prepare<string>("SELECT id, score, variance, plays, weights, neighbor, depth FROM weights_score WHERE (weights = ?)");
		this.selectWeightsById = this.db.prepare<string>(`SELECT weights FROM weights_score WHERE id = ?`);
		this.selectWeightsByScore = this.db.prepare<number>(`SELECT id, score, variance, plays, weights, neighbor, depth FROM weights_score ORDER BY score LIMIT ?`);
		this.insertAttemptScore = this.db.prepare<[string, string, number, number, number, string | undefined, number]>(`
			INSERT OR IGNORE INTO weights_score (id, weights, score, plays, variance, neighbor, depth)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`);
	}

	public addAttemptScore(id: string, attempt: string, score: number, plays: number, variance: number, neighbor: string | undefined, neighborDepth: number): number {
		if (neighbor == null && attempt !== "{}") {
			console.warn(`Empty neighbor: ${JSON.stringify(id)} ${attempt}`);
		}
		return this.insertAttemptScore.run(id, attempt, score, plays, variance, neighbor, neighborDepth).changes;
	}

	public findAttemptSummary(): SelectAttemptSummary | undefined {
		return this.selectAttemptSummary.get();
	}

	public findBestScores(limit = 1): BestScore[] {
		return this.selectWeightsByScore.all(limit).map((row: SelectBestScore) => ({
			id: row.id,
			neighborDepth: row.depth,
			neighborOf: isDefined(row.neighbor) ? row.neighbor : undefined,
			neighborSignature: "best",
			plays: row.plays,
			score: row.score,
			variance: row.variance,
			weights: JSON.parse(row.weights),
		}));
	}

	public findWeightsById(id: string): Partial<EffectWeightOpsFromType> {
		return this.selectWeightsById.all(id).map((row: {weights: string}) => JSON.parse(row.weights) as Partial<EffectWeightOpsFromType>)[0];
	}

	public scoreForAttempt(attempt: string): SelectWeightsStats | undefined {
		return this.selectScore.get(attempt);
	}

	public scoreForWeights(weights: Partial<EffectWeightOpsFromType>): number | undefined {
		return this.scoreForAttempt(stableJson(weights))?.score;
	}
}
