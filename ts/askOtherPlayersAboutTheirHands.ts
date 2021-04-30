import { EvidenceCard } from "./EvidenceCard";
import { UnknownCard } from "./MysteryCard";
import { OtherPlayer } from "./Player";
import { TurnStart } from "./TurnStart";

export interface OtherCardKnowledge {
	evidenceCard: EvidenceCard;
	handIndex: number;
	unknownCard: UnknownCard;
}

export interface OtherPlayerKnowledge {
	knowledge: OtherCardKnowledge[];
	otherPlayer: OtherPlayer;
}

export function askOtherPlayersAboutTheirHands(turn: TurnStart): OtherPlayerKnowledge[] {
	return turn.otherPlayers.map(otherPlayer => ({
		knowledge: turn.askOtherPlayerAboutTheirHand(otherPlayer).hand.map((unknownCard, handIndex) => ({
			evidenceCard: otherPlayer.hand[handIndex],
			handIndex,
			unknownCard,
		})),
		otherPlayer,
	}));
}
