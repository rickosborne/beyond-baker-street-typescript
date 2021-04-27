import { TurnStart } from "./TurnStart";
import { VisibleLead } from "./VisibleBoard";
import { LEAD_TYPES } from "./LeadType";

export function unconfirmedLeads(turnStart: TurnStart): VisibleLead[] {
	return LEAD_TYPES.map(leadType => turnStart.board.leads[leadType])
		.filter(lead => !lead.confirmed);
}
