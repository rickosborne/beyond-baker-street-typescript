import { Assisted, isAssisted } from "./AssistAction";
import { BotTurnEffect, BotTurnEffectType } from "./BotTurn";
import { EliminateKnownUnusedValueEffect, EliminateUnusedTypeEffect } from "./EliminateStrategy";
import { EVIDENCE_CARD_VALUE_MAX } from "./EvidenceCard";
import { HOLMES_MAX } from "./Game";
import { LEAD_TYPES } from "./LeadType";
import { PursueDuplicateEffect } from "./PursueStrategy";
import { TurnStart } from "./TurnStart";

export enum EffectWeightOperator {
	Add = "Add",
	Divide = "Divide",
	Invert = "Invert",
	Multiply = "Multiply",
	Negate = "Negate",
	Reverse = "Reverse",
	Subtract = "Subtract",
}

export const EFFECT_WEIGHT_OPERATORS: EffectWeightOperator[] = [
	EffectWeightOperator.Add,
	EffectWeightOperator.Divide,
	EffectWeightOperator.Invert,
	EffectWeightOperator.Multiply,
	EffectWeightOperator.Negate,
	EffectWeightOperator.Reverse,
	EffectWeightOperator.Subtract,
];

export enum EffectWeightOperand {
	AssistRatio = "AssistRatio",
	ConfirmedLeads = "ConfirmedLeads",
	EvidenceTarget = "EvidenceTarget",
	EvidenceValue = "EvidenceValue",
	EvidenceValueMax = "EvidenceValueMax",
	HolmesLocation = "HolmesLocation",
	HolmesProgress = "HolmesProgress",
	ImpossibleCount = "ImpossibleCount",
	ImpossiblePastLimit = "ImpossiblePastLimit",
	Probability4Plus = "Probability4Plus",
	RemainingCount = "RemainingCount",
	UnconfirmedLeads = "UnconfirmedLeads",
}

export const EFFECT_WEIGHT_OPERANDS: EffectWeightOperand[] = [
	EffectWeightOperand.AssistRatio,
	EffectWeightOperand.ConfirmedLeads,
	EffectWeightOperand.EvidenceTarget,
	EffectWeightOperand.EvidenceValue,
	EffectWeightOperand.EvidenceValueMax,
	EffectWeightOperand.HolmesLocation,
	EffectWeightOperand.HolmesProgress,
	EffectWeightOperand.ImpossibleCount,
	EffectWeightOperand.ImpossiblePastLimit,
	EffectWeightOperand.Probability4Plus,
	EffectWeightOperand.RemainingCount,
	EffectWeightOperand.UnconfirmedLeads,
];

export type EffectWeightOp = EffectWeightOperator | EffectWeightOperand | number;
export type EffectTurnStackConverter<S, R extends S | void> = S extends (string | number) ? (effect: BotTurnEffect, turnStart: TurnStart, stack: S[]) => R : (effect: BotTurnEffect, turnStart: TurnStart) => R;
export type EffectOperandResolver = EffectTurnStackConverter<unknown, number>;
export type EffectWeightFormatter = EffectTurnStackConverter<string, string>;
export type EffectWeightOperation = EffectTurnStackConverter<number, void>;
export interface EffectCalculator {
	calculate: EffectOperandResolver;
	format: EffectTurnStackConverter<unknown, string>;
}

export function ifEffectType<E extends BotTurnEffect>(type: BotTurnEffectType, mapper: (effect: E) => number): EffectOperandResolver {
	return e => {
		/* istanbul ignore if */
		if (e.effectType !== type) {
			throw new Error(`Effect ${e.effectType} found, but expected: ${type}`);
		}
		return mapper(e as E);
	};
}

export function ifEffectMatch<E>(
	guard: (effect: unknown) => effect is E,
	mapper: (effect: E) => number
): EffectOperandResolver {
	return e => {
		if (guard(e)) {
			return mapper(e);
		}
		/* istanbul ignore next */
		throw new Error(`Effect ${e.effectType} found but unexpected.`);
	};
}


const EFFECT_WEIGHT_OPERAND_RESOLVER: Record<EffectWeightOperand, EffectOperandResolver> = {
	[EffectWeightOperand.AssistRatio]: ifEffectMatch<Assisted>(isAssisted, a => a.assistRatio),
	[EffectWeightOperand.ConfirmedLeads]: (e, t) => LEAD_TYPES.filter(lt => t.board.leads[lt].confirmed).length,
	[EffectWeightOperand.EvidenceTarget]: ifEffectType<PursueDuplicateEffect>(BotTurnEffectType.PursueDuplicate, e => e.evidenceTarget),
	[EffectWeightOperand.EvidenceValue]: ifEffectType<EliminateKnownUnusedValueEffect>(BotTurnEffectType.EliminateKnownUnusedValue, e => e.evidenceValue),
	[EffectWeightOperand.EvidenceValueMax]: () => EVIDENCE_CARD_VALUE_MAX,
	[EffectWeightOperand.HolmesLocation]: (e, t) => t.board.holmesLocation,
	[EffectWeightOperand.HolmesProgress]: (e, t) => (HOLMES_MAX - t.board.holmesLocation) / HOLMES_MAX,
	[EffectWeightOperand.ImpossibleCount]: (e, t) => t.board.impossibleCards.length,
	[EffectWeightOperand.ImpossiblePastLimit]: (e, t) => Math.max(0, t.board.impossibleCards.length - t.board.caseFile.impossibleCount),
	[EffectWeightOperand.Probability4Plus]: ifEffectType<EliminateUnusedTypeEffect>(BotTurnEffectType.EliminateUnusedType, e => e.probability4plus),
	[EffectWeightOperand.RemainingCount]: (e, t) => t.board.remainingEvidenceCount,
	[EffectWeightOperand.UnconfirmedLeads]: (e, t) => LEAD_TYPES.filter(lt => !t.board.leads[lt].confirmed).length,
};

export function operandResolver(operand: EffectWeightOperand): EffectOperandResolver {
	return EFFECT_WEIGHT_OPERAND_RESOLVER[operand];
}

function unaryOp(name: string, fn: (a: number) => number): EffectWeightOperation {
	return (e, t, s: number[]): void => {
		const a = s.pop();
		/* istanbul ignore if */
		if (a === undefined) {
			throw new Error(`${name} requires at least 1 element.`);
		}
		s.push(fn(a));
	};
}

function binaryOp(name: string, fn: (a: number, b: number) => number): EffectWeightOperation {
	return (e, t, s: number[]): void => {
		const a = s.pop();
		const b = s.pop();
		/* istanbul ignore if */
		if (a === undefined || b === undefined) {
			throw new Error(`${name} requires at least 2 elements`);
		}
		s.push(fn(a, b));
	};
}

const EFFECT_WEIGHT_OPERATION_CALC: Record<EffectWeightOperator, EffectWeightOperation> = {
	[EffectWeightOperator.Add]: binaryOp("Add", (a, b) => a + b),
	[EffectWeightOperator.Divide]: binaryOp("Divide", (a, b) => b / a),
	[EffectWeightOperator.Invert]: unaryOp("Invert", a => 1 / a),
	[EffectWeightOperator.Multiply]: binaryOp("Multiply", (a, b) => a * b),
	[EffectWeightOperator.Negate]: unaryOp("Negate", a => 0 - a),
	[EffectWeightOperator.Reverse]: unaryOp("Reverse", a => 1 - a),
	[EffectWeightOperator.Subtract]: binaryOp("Subtract", (a, b) => b - a),
};

function format1(popped: (a: string) => string): EffectWeightFormatter {
	return (e, t, s): string => {
		const a = s.pop() as string;
		const result = popped(a);
		s.push(result);
		return result;
	};
}

function format2(popped: (a: string, b: string) => string): EffectWeightFormatter {
	return (e, t, s): string => {
		const [ a, b ] = [ s.pop() as string, s.pop() as string ];
		const result = popped(a, b);
		s.push(result);
		return result;
	};
}

function formatPush(op: EffectWeightOperand): EffectWeightFormatter {
	const resolver: EffectOperandResolver = operandResolver(op);
	return (e, t, s: string[]): string => {
		const value = String(resolver(e, t));
		s.push(value);
		return value;
	};
}

const EFFECT_WEIGHT_OPERATION_FORMAT: Record<EffectWeightOp, EffectWeightFormatter> = {
	[EffectWeightOperator.Add]: format2((a, b) => `(${b})+(${a})`),
	[EffectWeightOperator.Divide]: format2((a, b) => `(${b})/(${a})`),
	[EffectWeightOperator.Invert]: format1(a => `1/(${a})`),
	[EffectWeightOperator.Multiply]: format2((a, b) => `(${b})*(${a})`),
	[EffectWeightOperator.Negate]: format1(a => `0-(${a})`),
	[EffectWeightOperator.Reverse]: format1(a => `1-(${a})`),
	[EffectWeightOperator.Subtract]: format2((a, b) => `(${b})-(${a})`),
	[EffectWeightOperand.AssistRatio]: formatPush(EffectWeightOperand.AssistRatio),
	[EffectWeightOperand.ConfirmedLeads]: formatPush(EffectWeightOperand.ConfirmedLeads),
	[EffectWeightOperand.EvidenceTarget]: formatPush(EffectWeightOperand.EvidenceTarget),
	[EffectWeightOperand.EvidenceValue]: formatPush(EffectWeightOperand.EvidenceValue),
	[EffectWeightOperand.EvidenceValueMax]: formatPush(EffectWeightOperand.EvidenceValueMax),
	[EffectWeightOperand.HolmesLocation]: formatPush(EffectWeightOperand.HolmesLocation),
	[EffectWeightOperand.HolmesProgress]: formatPush(EffectWeightOperand.HolmesProgress),
	[EffectWeightOperand.ImpossibleCount]: formatPush(EffectWeightOperand.ImpossibleCount),
	[EffectWeightOperand.ImpossiblePastLimit]: formatPush(EffectWeightOperand.ImpossiblePastLimit),
	[EffectWeightOperand.Probability4Plus]: formatPush(EffectWeightOperand.Probability4Plus),
	[EffectWeightOperand.RemainingCount]: formatPush(EffectWeightOperand.RemainingCount),
	[EffectWeightOperand.UnconfirmedLeads]: formatPush(EffectWeightOperand.UnconfirmedLeads),

};

export function isEffectWeightOperand(maybe: unknown): maybe is EffectWeightOperand {
	return typeof maybe === "string" && EFFECT_WEIGHT_OPERANDS.includes(maybe as EffectWeightOperand);
}

export function isEffectWeightOperator(maybe: unknown): maybe is EffectWeightOperator {
	return typeof maybe === "string" && EFFECT_WEIGHT_OPERATORS.includes(maybe as EffectWeightOperator);
}

export function isNumber(maybe: unknown): maybe is number {
	return typeof maybe === "number" && !isNaN(maybe);
}

export function compileEffectWeight(
	ops: EffectWeightOp[],
	type: BotTurnEffectType,
	wantFormatter = true,
): EffectCalculator {
	if (ops.length < 1) {
		/* istanbul ignore next */
		throw new Error(`No ops for effectWeight`);
	}
	const math: EffectWeightOperation = ops.reduce((p, c): EffectWeightOperation => {
		if (isEffectWeightOperand(c)) {
			return function push(e, t, s): void {
				if (p != null) {
					p(e, t, s);
				}
				const resolver = operandResolver(c);
				const value = resolver(e, t);
				s.push(value);
			};
		} else if (isEffectWeightOperator(c)) {
			return function op(e, t, s): void {
				if (p != null) {
					p(e, t, s);
				}
				const operation = EFFECT_WEIGHT_OPERATION_CALC[c];
				operation(e, t, s);
			};
		} else {
			return function pushNumber(e, t, s): void {
				if (p != null) {
					p(e, t, s);
				}
				s.push(c);
			};
		}
	}, undefined as unknown as EffectWeightOperation);
	const formats: EffectWeightFormatter = wantFormatter ? ops.reduce((p, c): EffectWeightFormatter => {
		return (e, t, s): string => {
			if (p != null) {
				p(e, t, s);
			}
			if (isNumber(c)) {
				const constant = String(c);
				s.push(constant);
				return constant;
			}
			const opFormatter = EFFECT_WEIGHT_OPERATION_FORMAT[c];
			return opFormatter(e, t, s);
		};
	}, undefined as unknown as EffectWeightFormatter) : (e, t, s) => { s.push(""); return ""; };
	function doIt<T>(effect: BotTurnEffect, turnStart: TurnStart, fn: (effect: BotTurnEffect, turnStart: TurnStart, stack: T[]) => void): T {
		const s: T[] = [];
		fn(effect, turnStart, s);
		const value = s.pop();
		if (value === undefined) {
			/* istanbul ignore next */
			throw new Error(`Undefined result from ${type}`);
		} else if (s.length > 0) {
			/* istanbul ignore next */
			throw new Error(`Dirty stack for ${type}`);
		}
		return value;
	}
	return {
		calculate: (e: BotTurnEffect, t: TurnStart): number => doIt(e, t, math),
		format: (e: BotTurnEffect, t: TurnStart): string => wantFormatter ? doIt(e, t, formats) : "",
	};
}
