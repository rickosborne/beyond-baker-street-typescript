import { BotTurnEffectType } from "./BotTurn";
import { EffectWeightOp, EffectWeightOperand, EffectWeightOperator } from "./EffectWeight";

const HOLMES_MAX = 20;
export const DEFAULT_SCORE_FROM_TYPE: Record<BotTurnEffectType, EffectWeightOp[]> = {
	[BotTurnEffectType.Win]: [1000],
	[BotTurnEffectType.InvestigatePerfect]: [100],
	[BotTurnEffectType.PursueImpossible]: [50],
	[BotTurnEffectType.AssistExactEliminate]: [40],
	[BotTurnEffectType.PursueDuplicate]: [ 35, EffectWeightOperand.EvidenceTarget, EffectWeightOperator.Add ],
	[BotTurnEffectType.EliminateKnownUnusedValue]: [ 30, EffectWeightOperand.EvidenceValue, EffectWeightOperand.EvidenceValueMax, EffectWeightOperator.Add, EffectWeightOperand.EvidenceValueMax, 2, EffectWeightOperator.Multiply, EffectWeightOperator.Divide, EffectWeightOperator.Multiply ],
	[BotTurnEffectType.EliminateUnusedType]: [ 25, EffectWeightOperand.Probability4Plus, EffectWeightOperator.Multiply ],
	[BotTurnEffectType.AssistKnown]: [ 20, 20, EffectWeightOperand.AssistRatio, EffectWeightOperator.Reverse, EffectWeightOperator.Multiply, EffectWeightOperator.Subtract ],
	[BotTurnEffectType.InvestigateCorrectType]: [12],
	[BotTurnEffectType.EliminateSetsUpExact]: [10],
	[BotTurnEffectType.Confirm]: [8],
	[BotTurnEffectType.HolmesImpeded]: [8],
	[BotTurnEffectType.AssistImpossibleType]: [ 5, 5, EffectWeightOperand.AssistRatio, EffectWeightOperator.Reverse, EffectWeightOperator.Multiply, EffectWeightOperator.Subtract ],
	[BotTurnEffectType.AssistNarrow]: [ 3, 3, EffectWeightOperand.AssistRatio, EffectWeightOperator.Reverse, EffectWeightOperator.Multiply, EffectWeightOperator.Subtract ],
	[BotTurnEffectType.AssistNextPlayer]: [1],

	[BotTurnEffectType.InvestigateCorrectValue]: [0],

	[BotTurnEffectType.ImpossibleAdded]: [ EffectWeightOperand.ImpossibleCount, EffectWeightOperator.Negate ],
	[BotTurnEffectType.EliminateUnknownValue]: [-5],
	[BotTurnEffectType.HolmesProgress]: [ EffectWeightOperand.HolmesLocation, -HOLMES_MAX, EffectWeightOperator.Add ],
	[BotTurnEffectType.InvestigateMaybeBad]: [-10],
	[BotTurnEffectType.InvestigateWild]: [-12],
	[BotTurnEffectType.InvestigateBad]: [-15],
	[BotTurnEffectType.EliminateUsedType]: [-20],
	[BotTurnEffectType.PursueMaybe]: [-25],
	[BotTurnEffectType.EliminateKnownUsedValue]: [-30],
	[BotTurnEffectType.EliminateStompsExact]: [-40],
	[BotTurnEffectType.EliminateWild]: [-50],
	[BotTurnEffectType.MaybeLose]: [-60],
	[BotTurnEffectType.PursuePossible]: [-100],
	[BotTurnEffectType.Lose]: [-1000],
};
