import { AdlerInspectorStrategy } from "./inspector/Adler";
import { BaskervilleInspectorStrategy } from "./inspector/Baskerville";
import { MonoFunction } from "./Function";
import { HopeInspectorStrategy } from "./inspector/Hope";
import { HudsonInspectorStrategy } from "./inspector/Hudson";
import { InspectorStrategy } from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { Logger } from "./logger";
import { PikeInspectorStrategy } from "./inspector/Pike";
import { TobyInspectorStrategy } from "./inspector/Toby";

export type InspectorStrategyFactory = MonoFunction<Logger, InspectorStrategy | undefined>;

// Some of these are embedded in the main strategies just for simplicity.
const INSPECTOR_STRATEGY_FUNCTION: Record<InspectorType, InspectorStrategyFactory> = {
	Adler: () => new AdlerInspectorStrategy(),
	Baskerville: () => new BaskervilleInspectorStrategy(),
	Baynes: () => undefined,
	Blackwell: () => undefined,
	Bradstreet: () => undefined,
	Forrester: () => undefined,
	Gregson: () => undefined,
	Hope: () => new HopeInspectorStrategy(),
	Hopkins: () => undefined,
	Hudson: () => new HudsonInspectorStrategy(),
	Jones: () => undefined,
	Lestrade: () => undefined,
	Martin: () => undefined,
	Morstan: () => undefined,
	Pike: () => new PikeInspectorStrategy(),
	Stoner: () => undefined,
	Toby: logger => new TobyInspectorStrategy(logger),
	Wiggins: () => undefined,
};

export function strategyForInspector(inspectorType: InspectorType, logger: Logger): InspectorStrategy | undefined {
	const factory = INSPECTOR_STRATEGY_FUNCTION[inspectorType];
	if (factory == null) {
		throw new Error(`No supplier for inspector strategy: ${inspectorType}`);
	}
	return factory(logger);
}
