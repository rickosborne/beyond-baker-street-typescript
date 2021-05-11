import { Card, isCardOfType } from "./Card";
import { CardType } from "./CardType";

export interface CaseFileCard extends Card<CardType.CaseFile> {
	cardType: CardType.CaseFile;
	caseNumber: number;
	holmesStart: number;
	impossibleLimit: number;
}

export function isCaseFileCard(maybe: unknown): maybe is CaseFileCard {
	return isCardOfType<CardType.CaseFile>(maybe, CardType.CaseFile);
}

export function formatCaseFileCard(caseFile: CaseFileCard): string {
	return `${caseFile.caseNumber}:${caseFile.impossibleLimit}i:${caseFile.holmesStart}h`;
}

export const CASE_FILE_CARDS: CaseFileCard[] = [
	{
		cardType: CardType.CaseFile,
		caseNumber: 1,
		holmesStart: 15,
		impossibleLimit: 4,
	},
	{
		cardType: CardType.CaseFile,
		caseNumber: 2,
		holmesStart: 12,
		impossibleLimit: 4,
	},
	{
		cardType: CardType.CaseFile,
		caseNumber: 3,
		holmesStart: 11,
		impossibleLimit: 2,
	},
	{
		cardType: CardType.CaseFile,
		caseNumber: 4,
		holmesStart: 10,
		impossibleLimit: 2,
	},
	{
		cardType: CardType.CaseFile,
		caseNumber: 5,
		holmesStart: 9,
		impossibleLimit: 1,
	},
	{
		cardType: CardType.CaseFile,
		caseNumber: 6,
		holmesStart: 8,
		impossibleLimit: 1,
	},
];
