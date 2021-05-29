import { Consumer } from "../Consumer";
import { CompletedSimRun, SimRun } from "../SimRun";

export enum OptimizeEventType {
	BestChanged = "BestChanged",
	ConfigChanged = "ConfigChanged",
	GameFinished = "GameFinished",
	GameStarted = "GameStarted",
}

interface OptimizeEvent<E extends OptimizeEventType> {
	type: E;
}

export interface BestChanged extends OptimizeEvent<OptimizeEventType.BestChanged> {
	best: SimRun[];
}
export interface ConfigChanged extends OptimizeEvent<OptimizeEventType.ConfigChanged> {
	config: {
		iterations: number;
	};
}
export interface GameFinished extends OptimizeEvent<OptimizeEventType.GameFinished> {
	run: CompletedSimRun;
}
export interface GameStarted extends OptimizeEvent<OptimizeEventType.GameStarted> {
	run: SimRun;
}

export interface OptimizeInstrumentPublisher {
	onBestChanged(handler: Consumer<BestChanged>): void;
	onConfigChanged(handler: Consumer<ConfigChanged>): void;
	onGameFinished(handler: Consumer<GameFinished>): void;
	onGameStarted(handler: Consumer<GameStarted>): void;
}

export interface OptimizeInstrumentCollector {
	bestChanged(event: BestChanged): void;
	configChanged(event: ConfigChanged): void;
	gameFinished(event: GameFinished): void;
	gameStarted(event: GameStarted): void;
}

class OptimizeInstrumentImpl implements OptimizeInstrumentPublisher, OptimizeInstrumentCollector {
	private readonly bestChangedHandlers: Consumer<BestChanged>[] = [];
	private readonly configChangedHandlers: Consumer<ConfigChanged>[] = [];
	private readonly gameFinishedHandlers: Consumer<GameFinished>[] = [];
	private readonly gameStartedHandlers: Consumer<GameStarted>[] = [];

	bestChanged(event: BestChanged): void {
		this.bestChangedHandlers.forEach(h => h(event));
	}

	configChanged(event: ConfigChanged): void {
		this.configChangedHandlers.forEach(h => h(event));
	}

	gameFinished(event: GameFinished): void {
		this.gameFinishedHandlers.forEach(h => h(event));
	}

	gameStarted(event: GameStarted): void {
		this.gameStartedHandlers.forEach(h => h(event));
	}

	onBestChanged(handler: Consumer<BestChanged>): void {
		this.bestChangedHandlers.push(handler);
	}

	onConfigChanged(handler: Consumer<ConfigChanged>): void {
		this.configChangedHandlers.push(handler);
	}

	onGameFinished(handler: Consumer<GameFinished>): void {
		this.gameFinishedHandlers.push(handler);
	}

	onGameStarted(handler: Consumer<GameStarted>): void {
		this.gameStartedHandlers.push(handler);
	}
}

let optimizeInstrumentInstance: OptimizeInstrumentImpl | undefined;

export function getOptimizeInstrumentPublisher(): OptimizeInstrumentPublisher {
	if (optimizeInstrumentInstance === undefined) {
		optimizeInstrumentInstance = new OptimizeInstrumentImpl();
	}
	return optimizeInstrumentInstance;
}

export function getOptimizeInstrumentCollector(): OptimizeInstrumentCollector {
	if (optimizeInstrumentInstance === undefined) {
		optimizeInstrumentInstance = new OptimizeInstrumentImpl();
	}
	return optimizeInstrumentInstance;
}

