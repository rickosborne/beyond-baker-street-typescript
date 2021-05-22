import { BOT_TURN_EFFECT_TYPES, BotTurnEffectType, isBotTurnEffectType } from "./BotTurn";
import { isDefined } from "./defined";
import { EffectWeightFormula, EffectWeightModifier } from "./EffectWeight";
import { strictDeepEqual } from "./strictDeepEqual";

// "{""EliminateWild"":[19,4,""PlusHolmesLocation""],""InvestigationComplete"":[15,1,""RampDownWithInvestigationProgress""],""PursueConfirmable"":[22,-45,""OverImpossiblePastLimit""]}"
// "{""AssistKnown"":[4,10,""PlusImpossibleCount""],""HolmesProgress"":[-17,15,""TimesHolmesProgressReversed""],""PursueConfirmable"":[18,-35,""OverHolmesProgressReversed""]}"

export type EffectWeightOpsFromType = Record<BotTurnEffectType, EffectWeightFormula>;
export const DEFAULT_SCORE_FROM_TYPE: EffectWeightOpsFromType = {
	[BotTurnEffectType.AssistExactEliminate]: [13],
	[BotTurnEffectType.AssistImpossibleType]: [-22],
	[BotTurnEffectType.AssistKnown]: [8],
	[BotTurnEffectType.AssistNarrow]: [14],
	[BotTurnEffectType.AssistNextPlayer]: [4],
	[BotTurnEffectType.AssistNotHope]: [-1],
	[BotTurnEffectType.Confirm]: [3],
	[BotTurnEffectType.ConfirmEventually]: [25],
	[BotTurnEffectType.ConfirmNotBaynes]: [-15],
	[BotTurnEffectType.ConfirmReady]: [3],
	[BotTurnEffectType.HolmesImpeded]: [7],
	[BotTurnEffectType.EliminateMaybeUseful]: [5],
	[BotTurnEffectType.EliminateMaybeUsefulCompletesInvestigation]: [ -6, 13, EffectWeightModifier.RampUpWithHolmesProgress ],
	[BotTurnEffectType.EliminateMaybeUsefulSetsUpExact]: [10],
	[BotTurnEffectType.EliminateMightLose]: [-70],
	[BotTurnEffectType.EliminatePossibility]: [0],
	[BotTurnEffectType.EliminateUnused]: [15],
	[BotTurnEffectType.EliminateUnusedCompletesInvestigation]: [25],
	[BotTurnEffectType.EliminateUnusedSetsUpExact]: [20],
	[BotTurnEffectType.EliminateWedgesInvestigation]: [-60],
	[BotTurnEffectType.EliminateWedgesLead]: [-40],
	[BotTurnEffectType.HolmesProgress]: [-20],
	[BotTurnEffectType.ImpossibleAdded]: [0],
	[BotTurnEffectType.InvestigateBadButAvailable]: [1],
	[BotTurnEffectType.InvestigateBadButVisible]: [2],
	[BotTurnEffectType.InvestigateBadOnUnwedgedDoesWedge]: [-35],
	[BotTurnEffectType.InvestigateBadOnWedged]: [-13],
	[BotTurnEffectType.InvestigateBreaksConfirmable]: [-35],
	[BotTurnEffectType.InvestigateGoodAndAvailable]: [15],
	[BotTurnEffectType.InvestigateGoodAndVisible]: [30],
	[BotTurnEffectType.InvestigateGoodButWouldWedge]: [-40],
	[BotTurnEffectType.InvestigateGoodMakesConfirmable]: [35],
	[BotTurnEffectType.InvestigatePossibility]: [0],
	[BotTurnEffectType.InvestigateTooFar]: [-40],
	[BotTurnEffectType.InvestigateTooMuchBad]: [-40],
	[BotTurnEffectType.InvestigateUnwedgeForAvailable]: [30],
	[BotTurnEffectType.InvestigateUnwedgeForVisible]: [40],
	[BotTurnEffectType.InvestigationComplete]: [0],
	[BotTurnEffectType.Lose]: [-1000],
	[BotTurnEffectType.PursueConfirmable]: [-40],
	[BotTurnEffectType.PursueDuplicate]: [50],
	[BotTurnEffectType.PursueImpossible]: [18],
	[BotTurnEffectType.PursueMaybe]: [-11],
	[BotTurnEffectType.PursuePossible]: [-29],
	[BotTurnEffectType.Toby]: [5],
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

export function formatEffectWeightOpsFromTypeDiff(
	after: Partial<EffectWeightOpsFromType>,
	before: Partial<EffectWeightOpsFromType> = {},
	showEqual = true,
): string {
	return BOT_TURN_EFFECT_TYPES
		.map((effectType: BotTurnEffectType): string | undefined => {
			const a = after[effectType];
			const b = before[effectType];
			if (a == null && b == null) {
				return undefined;  // `!${effectType}`;
			} else if (a == null && b != null) {
				return `-${effectType}:[${b?.join(",")}]`;
			} else if (b == null && a != null) {
				return `+${effectType}:[${a?.join(",")}]`;
			} else if (strictDeepEqual(a, b)) {
				return showEqual ? `=${effectType}:[${a?.join(",")}]` : undefined;
			} else {
				return `${effectType}:[${b?.join(",")}]=>[${a?.join(",")}]`;
			}
		})
		.filter(isDefined)
		.join(" ");
}
