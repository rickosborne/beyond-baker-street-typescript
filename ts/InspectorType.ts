export enum InspectorType {
	Adler = "Adler",
	Baynes = "Baynes",
	Baskerville = "Baskerville",
	Blackwell = "Blackwell",
	Broadstreet = "Broadstreet",
	Forrester = "Forrester",
	Gregson = "Gregson",
	Hope = "Hope",
	Hopkins = "Hopkins",
	Hudson = "Hudson",
	Jones = "Jones",
	Lestrade = "Lestrade",
	Martin = "Martin",
	Morstan = "Morstan",
	Pike = "Pike",
	Stoner = "Stoner",
	Toby = "Toby",
	Wiggins = "Wiggins",
}

export const INSPECTOR_TYPES: InspectorType[] = [
	InspectorType.Adler,
	InspectorType.Baynes,
	InspectorType.Baskerville,
	InspectorType.Blackwell,
	InspectorType.Broadstreet,
	InspectorType.Forrester,
	InspectorType.Gregson,
	InspectorType.Hope,
	InspectorType.Hopkins,
	InspectorType.Hudson,
	InspectorType.Jones,
	InspectorType.Lestrade,
	InspectorType.Martin,
	InspectorType.Morstan,
	InspectorType.Pike,
	InspectorType.Stoner,
	InspectorType.Toby,
	InspectorType.Wiggins,
];

export function isInspectorType(maybe: unknown): maybe is InspectorType {
	return (typeof maybe === "string")
		&& (INSPECTOR_TYPES.indexOf(maybe as InspectorType) >= 0);
}
