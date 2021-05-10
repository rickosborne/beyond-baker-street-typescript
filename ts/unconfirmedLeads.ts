import { LEAD_TYPES } from "./LeadType";
import { HasVisibleBoard, leadIsUnfinished, VisibleLead } from "./VisibleBoard";

export function unconfirmedLeads(hasVisibleBoard: HasVisibleBoard): VisibleLead[] {
	return LEAD_TYPES.map(leadType => hasVisibleBoard.board.leads[leadType])
		.filter(lead => !lead.confirmed);
}

/**
 * Leads which are unconfirmed and still need more evidence.
 */
export function unfinishedLeads(hasVisibleBoard: HasVisibleBoard): VisibleLead[] {
	return LEAD_TYPES.map(leadType => hasVisibleBoard.board.leads[leadType])
		.filter(leadIsUnfinished);
}
