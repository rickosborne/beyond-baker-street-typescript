import { EvidenceCard } from "./EvidenceCard";
import { OtherHand } from "./OtherHand";
import { OtherPlayer } from "./Player";
import { HasVisibleBoard, VisibleBoard } from "./VisibleBoard";

export interface BlackwellChoice {
	bury: EvidenceCard,
	keep: EvidenceCard,
}

export interface BlackwellTurn extends HasVisibleBoard {
	askBlackwellAboutTheirHand(): OtherHand;
	askOtherPlayerAboutTheirHand(otherPlayer: OtherPlayer): OtherHand;
	blackwell: OtherPlayer;
	board: VisibleBoard;
	evidences: EvidenceCard[];
	otherPlayers: OtherPlayer[];
}
