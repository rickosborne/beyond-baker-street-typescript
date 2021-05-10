import { AdlerInspectorStrategy } from "./Adler";
import { isAssistValueOption } from "./AssistStrategy";
import { BaskervilleInspectorStrategy } from "./Baskerville";
import { EvidenceType } from "./EvidenceType";
import { MonoFunction } from "./Function";
import { HopeInspectorStrategy } from "./Hope";
import { HudsonInspectorStrategy } from "./Hudson";
import {
	CannotIdentifyTypeInspectorStrategy,
	InspectorStrategy,
	OnOptionProcessingResult,
	OptionProcessingInspectorStrategy,
} from "./InspectorStrategy";
import { InspectorType } from "./InspectorType";
import { Logger } from "./logger";
import { PikeInspectorStrategy } from "./Pike";
import { TobyInspectorStrategy } from "./Toby";

export type InspectorStrategyFactory = MonoFunction<Logger, InspectorStrategy | undefined>;

// Some of these are embedded in the main strategies just for simplicity.
const INSPECTOR_STRATEGY_FUNCTION: Record<InspectorType, InspectorStrategyFactory> = {
	Adler: () => new AdlerInspectorStrategy(),
	Baskerville: () => new BaskervilleInspectorStrategy(),
	Baynes: () => undefined,
	Blackwell: () => undefined,
	Bradstreet: () => new CannotIdentifyTypeInspectorStrategy(InspectorType.Bradstreet, EvidenceType.Document),
	Forrester: () => new CannotIdentifyTypeInspectorStrategy(InspectorType.Forrester, EvidenceType.Clue),
	Gregson: () => undefined,
	Hope: () => new HopeInspectorStrategy(),
	Hopkins: () => new CannotIdentifyTypeInspectorStrategy(InspectorType.Hopkins, EvidenceType.Witness),
	Hudson: () => new HudsonInspectorStrategy(),
	Jones: () => new CannotIdentifyTypeInspectorStrategy(InspectorType.Jones, EvidenceType.Track),
	Lestrade: () => undefined,
	Martin: () => new OptionProcessingInspectorStrategy(InspectorType.Martin, isAssistValueOption, () => OnOptionProcessingResult.Remove),
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
