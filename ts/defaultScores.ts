import { BOT_TURN_EFFECT_TYPES, BotTurnEffectType, isBotTurnEffectType } from "./BotTurn";
import { isDefined } from "./defined";
import { EffectWeightFormula } from "./EffectWeight";
import { strictDeepEqual } from "./strictDeepEqual";

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
	[BotTurnEffectType.EliminateKnownValueUnusedType]: [30],
	[BotTurnEffectType.EliminateKnownValueUsedType]: [4],
	[BotTurnEffectType.EliminateSetsUpExact]: [10],
	[BotTurnEffectType.EliminateStompsExact]: [-13],
	[BotTurnEffectType.EliminateUnknownValueUnusedType]: [32],
	[BotTurnEffectType.EliminateUnknownValueUsedType]: [-21],
	[BotTurnEffectType.EliminateWild]: [-3],
	[BotTurnEffectType.HolmesImpeded]: [7],
	[BotTurnEffectType.HolmesProgress]: [-20],
	[BotTurnEffectType.ImpossibleAdded]: [0],
	[BotTurnEffectType.InvestigateBadOnUnwedged]: [-37],
	[BotTurnEffectType.InvestigateBadOnWedged]: [-13],
	[BotTurnEffectType.InvestigateCorrectType]: [12],
	[BotTurnEffectType.InvestigateCorrectValue]: [-1],
	[BotTurnEffectType.InvestigateMaybeBad]: [-30],
	[BotTurnEffectType.InvestigatePerfect]: [30],
	[BotTurnEffectType.InvestigateUnwedgeWithBad]: [30],
	[BotTurnEffectType.InvestigateWild]: [-9],
	[BotTurnEffectType.InvestigateWouldWedge]: [-42],
	[BotTurnEffectType.InvestigationComplete]: [33],
	[BotTurnEffectType.Lose]: [-1000],
	[BotTurnEffectType.MaybeLose]: [-33],
	[BotTurnEffectType.PursueConfirmable]: [-10],
	[BotTurnEffectType.PursueDuplicate]: [36],
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
	before: Partial<EffectWeightOpsFromType>,
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
