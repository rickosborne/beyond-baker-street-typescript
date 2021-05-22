import { interpolate } from "./interpolate";

const T_SCORES_BY_A_THEN_DF: Partial<Record<number, Partial<Record<number, number>>>> = {
	0.005: {
		1: 63.657,
		100: 2.626,
		1000: 2.581,
		14: 2.977,
		19: 2.861,
		2: 9.925,
		2000: 2.578,
		29: 2.756,
		3: 5.841,
		4: 4.604,
		40: 2.706,
		5: 4.032,
		6: 3.707,
		7: 3.499,
		8: 3.355,
		9: 3.250,
	},
	0.01: {
		1: 31.821,
		19: 2.539,
		2: 6.965,
		2000: 2.326,
		249: 2.341,
		29: 2.462,
		3: 4.541,
		4: 3.747,
		49: 2.405,
		499: 2.334,
		5: 3.365,
		6: 3.143,
		69: 2.382,
		7: 2.998,
		8: 2.896,
		9: 2.821,
		99: 2.365,
		999: 2.330,
	},
	0.02: {
		249: 2.065,
		49: 2.110,
		499: 2.059,
		9: 2.398,
		99: 2.081,
		999: 2.056,
	},
	0.025: {
		1: 12.706,
		2: 4.303,
		249: 1.970,
		3: 3.182,
		4: 2.776,
		49: 2.010,
		499: 1.965,
		5: 2.571,
		6: 2.447,
		7: 2.365,
		8: 2.306,
		9: 2.262,
		99: 1.984,
		999: 1.962,
	},
	0.05: {
		1: 6.314,
		2: 2.920,
		249: 1.651,
		3: 2.353,
		4: 2.132,
		49: 1.677,
		499: 1.648,
		5: 2.015,
		6: 1.943,
		7: 1.895,
		8: 1.860,
		9: 1.833,
		99: 1.660,
		999: 1.645,
	},
	0.1: {
		1: 3.078,
		100: 1.290,
		1000: 1.282,
		19: 1.328,
		2: 1.886,
		29: 1.311,
		3: 1.638,
		4: 1.533,
		5: 1.476,
		6: 1.440,
		7: 1.415,
		8: 1.397,
		9: 1.383,
	},
};

export function tScore(degreesOfFreedom: number, alpha: number, saveInterpolated = true): number {
	const forAlpha = T_SCORES_BY_A_THEN_DF[alpha];
	if (forAlpha === undefined) {
		throw new Error(`Alpha not present in t-dist lookup table: ${alpha}`);
	}
	let score = forAlpha[Math.round(degreesOfFreedom)];
	if (score === undefined) {  // meh, awful
		const existing = Object.keys(forAlpha).map(Number);
		const dfLess = Math.max(...existing.filter(e => e < degreesOfFreedom));
		const dfMore = Math.min(...existing.filter(e => e > degreesOfFreedom));
		if (dfMore === Infinity) {
			score = forAlpha[Math.max(...existing)] as number;
		} else if (dfLess === -Infinity || dfLess === undefined || dfMore === undefined) {
			throw new Error(`DF ${degreesOfFreedom} not found for alpha ${alpha} in t-dist lookup table.`);
		} else {
			const lower = forAlpha[dfMore] as number;
			const upper = forAlpha[dfLess] as number;
			score = interpolate(dfLess, dfMore, upper, lower, degreesOfFreedom);
		}
		if (saveInterpolated && (Math.round(degreesOfFreedom) === degreesOfFreedom)) {
			forAlpha[degreesOfFreedom] = score;
		}
	}
	return score;
}

export const T_DIST_ALPHA_DEFAULT = 0.05;
