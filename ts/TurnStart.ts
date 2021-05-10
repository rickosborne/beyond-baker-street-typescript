import { OtherHand } from "./OtherHand";
import { OtherPlayer, Player } from "./Player";
import { HasVisibleBoard, VisibleBoard } from "./VisibleBoard";

export interface TurnStart extends HasVisibleBoard {
	askOtherPlayerAboutTheirHand(otherPlayer: OtherPlayer): OtherHand;
	board: VisibleBoard;
	nextPlayer: Player;
	otherPlayers: OtherPlayer[];
	player: Player;
}
