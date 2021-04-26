export enum Facing {
	Down = "Down",
	Up = "Up",
}

export const FACINGS: Facing[] = [
	Facing.Down,
	Facing.Up,
];

export function isFacing(maybe: unknown): maybe is Facing {
	return (typeof maybe === "string")
		&& FACINGS.includes(maybe as Facing);
}
