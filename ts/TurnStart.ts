import { OtherPlayer, Player } from "./Player";
import { VisibleBoard } from "./VisibleBoard";

export interface TurnStart {
	board: VisibleBoard;
	otherPlayers: OtherPlayer[];
}
