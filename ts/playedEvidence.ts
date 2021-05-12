import { EvidenceCard, isEvidenceCard } from "./EvidenceCard";
import { LEAD_TYPES } from "./LeadType";
import { TurnStart } from "./TurnStart";

/**
 * Evidence already played, and therefore not available to be played later.
 * (Barring special abilities.)
 */
export function playedEvidence(turn: TurnStart): EvidenceCard[] {
	const played: EvidenceCard[] = LEAD_TYPES.flatMap(leadType => {
		const lead = turn.board.leads[leadType];
		const cards: EvidenceCard[] = lead.evidenceCards.slice();
		cards.push(...lead.badCards);
		return cards;
	});
	played.push(...turn.board.impossibleCards.filter(isEvidenceCard));
	return played;
}
