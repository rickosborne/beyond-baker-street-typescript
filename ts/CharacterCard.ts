import { Card, isCardOfType } from "./Card";
import { CardType } from "./CardType";
import { InspectorType, isInspectorType } from "./InspectorType";

export interface CharacterCard extends Card<CardType.Character> {
	cardType: CardType.Character;
	characterType: InspectorType;
	order: number;
	pipeCount: number;
}

export function isCharacterCard(maybe: unknown): maybe is CharacterCard {
	const cc = maybe as CharacterCard;
	return isCardOfType<CardType.Character>(maybe, CardType.Character)
		&& isInspectorType(cc.characterType)
		&& (typeof cc.order === "number")
		&& (typeof cc.pipeCount === "number");
}

export const CHARACTER_CARDS: CharacterCard[] = [
	{
		cardType: CardType.Character,
		characterType: InspectorType.Lestrade,
		order: 1,
		pipeCount: 4,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Gregson,
		order: 2,
		pipeCount: 4,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Baynes,
		order: 3,
		pipeCount: 3,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Bradstreet,
		order: 4,
		pipeCount: 1,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Hopkins,
		order: 5,
		pipeCount: 1,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Jones,
		order: 6,
		pipeCount: 1,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Forrester,
		order: 7,
		pipeCount: 1,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Martin,
		order: 8,
		pipeCount: 1,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Adler,
		order: 9,
		pipeCount: 2,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Morstan,
		order: 10,
		pipeCount: 2,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Blackwell,
		order: 11,
		pipeCount: 3,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Stoner,
		order: 12,
		pipeCount: 3,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Hope,
		order: 13,
		pipeCount: 4,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Baskerville,
		order: 14,
		pipeCount: 3,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Pike,
		order: 15,
		pipeCount: 3,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Wiggins,
		order: 16,
		pipeCount: 3,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Hudson,
		order: 17,
		pipeCount: 3,
	},
	{
		cardType: CardType.Character,
		characterType: InspectorType.Toby,
		order: 18,
		pipeCount: 4,
	},
];
