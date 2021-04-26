import { Card, isCardOfType } from "./Card";
import { CardType } from "./CardType";

export interface CaseFileCard extends Card<CardType.CaseFile> {
	cardType: CardType.CaseFile;
	caseNumber: number;
	holmesStart: number;
	impossibleCount: number;
}

export function isCaseFileCard(maybe: unknown): maybe is CaseFileCard {
	return isCardOfType<CardType.CaseFile>(maybe, CardType.CaseFile);
}

export const CASE_FILE_CARDS: CaseFileCard[] = [
	{
		cardType: CardType.CaseFile,
		caseNumber: 1,
		holmesStart: 15,
		impossibleCount: 4,
	},
	{
		cardType: CardType.CaseFile,
		caseNumber: 2,
		holmesStart: 12,
		impossibleCount: 4,
	},
	{
		cardType: CardType.CaseFile,
		caseNumber: 3,
		holmesStart: 11,
		impossibleCount: 2,
	},
	{
		cardType: CardType.CaseFile,
		caseNumber: 4,
		holmesStart: 10,
		impossibleCount: 2,
	},
	{
		cardType: CardType.CaseFile,
		caseNumber: 5,
		holmesStart: 9,
		impossibleCount: 1,
	},
	{
		cardType: CardType.CaseFile,
		caseNumber: 6,
		holmesStart: 8,
		impossibleCount: 1,
	},
];
