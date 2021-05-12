import { LEAD_TYPES } from "./LeadType";
import { HasVisibleBoard, VisibleLead } from "./VisibleBoard";

export function unconfirmedLeads(hasVisibleBoard: HasVisibleBoard): VisibleLead[] {
	return LEAD_TYPES.map(leadType => hasVisibleBoard.board.leads[leadType])
		.filter(lead => !lead.confirmed);
}

