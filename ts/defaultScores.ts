import { BOT_TURN_EFFECT_TYPES, BotTurnEffectType, isBotTurnEffectType } from "./BotTurn";
import { EffectWeightFormula, formatEffectWeightFormula } from "./EffectWeight";
import { isDefined } from "./util/defined";
import { strictDeepEqual } from "./util/strictDeepEqual";

export type EffectWeightOpsFromType = Record<BotTurnEffectType, EffectWeightFormula>;
export const DEFAULT_SCORE_FROM_TYPE: EffectWeightOpsFromType = {
	[BotTurnEffectType.AssistExactEliminate]: [155],
	[BotTurnEffectType.AssistImpossibleType]: [-305],
	[BotTurnEffectType.AssistKnown]: [155],
	[BotTurnEffectType.AssistNarrow]: [305],
	[BotTurnEffectType.AssistNextPlayer]: [155],
	[BotTurnEffectType.AssistNotHope]: [45],
	[BotTurnEffectType.Confirm]: [80],
	[BotTurnEffectType.ConfirmEventually]: [45],
	[BotTurnEffectType.ConfirmNotBaynes]: [45],
	[BotTurnEffectType.ConfirmReady]: [45],
	[BotTurnEffectType.ElimAssistedType]: [45],
	[BotTurnEffectType.ElimAssistedValue]: [45],
	[BotTurnEffectType.EliminateMaybeUseful]: [155],
	[BotTurnEffectType.EliminateMaybeUsefulCompletesInvestigation]: [-200],
	[BotTurnEffectType.EliminateMaybeUsefulSetsUpExact]: [200],
	[BotTurnEffectType.EliminateMightLose]: [-1070],
	[BotTurnEffectType.EliminatePossibility]: [425],
	[BotTurnEffectType.EliminateUnused]: [-110],
	[BotTurnEffectType.EliminateUnusedCompletesInvestigation]: [425],
	[BotTurnEffectType.EliminateUnusedSetsUpExact]: [0],
	[BotTurnEffectType.EliminateWedgesInvestigation]: [-155],
	[BotTurnEffectType.EliminateWedgesLead]: [20],
	[BotTurnEffectType.HolmesImpeded]: [45],
	[BotTurnEffectType.HolmesProgress]: [-270],
	[BotTurnEffectType.ImpossibleAdded]: [80],
	[BotTurnEffectType.InvAssistedType]: [45],
	[BotTurnEffectType.InvAssistedValue]: [45],
	[BotTurnEffectType.InvestigateBadButAvailable]: [45],
	[BotTurnEffectType.InvestigateBadButVisible]: [45],
	[BotTurnEffectType.InvestigateBadOnUnwedgedDoesWedge]: [-495],
	[BotTurnEffectType.InvestigateBadOnWedged]: [-920],
	[BotTurnEffectType.InvestigateBreaksConfirmable]: [-460],
	[BotTurnEffectType.InvestigateGoodAndAvailable]: [305],
	[BotTurnEffectType.InvestigateGoodAndVisible]: [540],
	[BotTurnEffectType.InvestigateGoodButWouldWedge]: [-80],
	[BotTurnEffectType.InvestigateGoodMakesConfirmable]: [575],
	[BotTurnEffectType.InvestigatePossibility]: [45],
	[BotTurnEffectType.InvestigateTooFar]: [-620],
	[BotTurnEffectType.InvestigateTooMuchBad]: [-620],
	[BotTurnEffectType.InvestigateUnwedgeForAvailable]: [540],
	[BotTurnEffectType.InvestigateUnwedgeForVisible]: [695],
	[BotTurnEffectType.InvestigationComplete]: [0],
	[BotTurnEffectType.Lose]: [-1000],
	[BotTurnEffectType.PursueConfirmable]: [0],
	[BotTurnEffectType.PursueDuplicate]: [305],
	[BotTurnEffectType.PursueImpossible]: [340],
	[BotTurnEffectType.PursueMaybe]: [45],
	[BotTurnEffectType.PursuePossible]: [-495],
	[BotTurnEffectType.Toby]: [155],
	[BotTurnEffectType.Win]: [1000],
};

export function isEffectWeightOpsFromType(maybe: unknown): maybe is EffectWeightOpsFromType {
	const rec = maybe as Record<string, unknown>;
	return (maybe != null)
		&& (typeof maybe === "object")
		&& (!Array.isArray(maybe))
		&& (Object.keys(rec).findIndex(k => !isBotTurnEffectType(k) || !Array.isArray(rec[k])) < 0);
}

export function formatOrderedEffectWeightOpsFromType(weights: Partial<EffectWeightOpsFromType>): string {
	return (Object.keys(weights) as BotTurnEffectType[])
		.sort((a, b) => ((weights[b] as EffectWeightFormula)[0] as number) - ((weights[a] as EffectWeightFormula)[0] as number))
		.map(key => `${key}:${(weights[key]?.join(","))}`)
		.join(" > ");
}

const EMPTY_BEFORE: Partial<EffectWeightOpsFromType> = {};

export function formatEffectWeightOpsFromTypeDiff(
	after: Partial<EffectWeightOpsFromType>,
	before: Partial<EffectWeightOpsFromType> = EMPTY_BEFORE,
	showEqual = true,
): string {
	return BOT_TURN_EFFECT_TYPES
		.map((effectType: BotTurnEffectType): string | undefined => {
			const a = after[effectType];
			const b = before[effectType];
			if (a == null && b == null) {
				return undefined;  // `!${effectType}`;
			} else if (a == null && b != null) {
				return `-${effectType}:[${formatEffectWeightFormula(b)}]`;
			} else if (b == null && a != null) {
				return `${before === EMPTY_BEFORE ? "" : "+"}${effectType}:[${formatEffectWeightFormula(a)}]`;
			} else if (strictDeepEqual(a, b)) {
				return showEqual ? `=${effectType}:[${formatEffectWeightFormula(a)}]` : undefined;
			} else {
				return `${effectType}:[${formatEffectWeightFormula(b)}]=>[${formatEffectWeightFormula(a)}]`;
			}
		})
		.filter(isDefined)
		.join(" ");
}
