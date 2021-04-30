import { OtherPlayer, Player } from "./Player";
import { VisibleBoard } from "./VisibleBoard";
import { OtherHand } from "./OtherHand";

export interface TurnStart {
	askOtherPlayerAboutTheirHand(otherPlayer: OtherPlayer): OtherHand;
	board: VisibleBoard;
	nextPlayer: Player;
	otherPlayers: OtherPlayer[];
	player: Player;
}
