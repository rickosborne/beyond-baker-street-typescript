import { BlackwellTurn } from "./Blackwell";
import { EVIDENCE_CARD_VALUES, EvidenceCard, isEvidenceCard } from "./EvidenceCard";
import { EVIDENCE_TYPES, EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { groupBy } from "./groupBy";
import { invertValues } from "./InvertValues";
import { LEAD_TYPES } from "./LeadType";
import { objectMap } from "./objectMap";
import { TurnStart } from "./TurnStart";

/**
 * Evidence already played, and therefore not available to be played later.
 * (Barring special abilities.)
 */
export function playedEvidence(turn: TurnStart | BlackwellTurn): EvidenceCard[] {
	const played: EvidenceCard[] = LEAD_TYPES.flatMap(leadType => {
		const lead = turn.board.leads[leadType];
		const cards: EvidenceCard[] = lead.evidenceCards.slice();
		cards.push(...lead.badCards);
		return cards;
	});
	played.push(...turn.board.impossibleCards.filter(isEvidenceCard));
	return played;
}

export function availableValuesByType(turn: TurnStart | BlackwellTurn): Record<EvidenceType, EvidenceValue[]> {
	const played = playedEvidence(turn);
	const unavailableCardsByType: Record<EvidenceType, EvidenceCard[]> = groupBy(played, c => c.evidenceType);
	const mapped = objectMap(unavailableCardsByType, cards => invertValues(...cards.map(c => c.evidenceValue)));
	EVIDENCE_TYPES.forEach(evidenceType => {
		if (mapped[evidenceType] == null) {
			mapped[evidenceType] = EVIDENCE_CARD_VALUES.slice();
		}
	});
	return mapped;
}

export function availableValuesOfType(evidenceType: EvidenceType, turn: TurnStart | BlackwellTurn): EvidenceValue[] {
	return availableValuesByType(turn)[evidenceType];
}
