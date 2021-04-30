import { LEAD_TYPES } from "./LeadType";
import { TurnStart } from "./TurnStart";
import { leadIsUnfinished, VisibleLead } from "./VisibleBoard";

export function unconfirmedLeads(turnStart: TurnStart): VisibleLead[] {
	return LEAD_TYPES.map(leadType => turnStart.board.leads[leadType])
		.filter(lead => !lead.confirmed);
}

/**
 * Leads which are unconfirmed and still need more evidence.
 */
export function unfinishedLeads(turnStart: TurnStart): VisibleLead[] {
	return LEAD_TYPES.map(leadType => turnStart.board.leads[leadType])
		.filter(leadIsUnfinished);
}
