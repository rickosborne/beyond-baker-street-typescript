import { HasVisibleBoard, leadIsUnfinished, VisibleLead } from "./VisibleBoard";
import { LEAD_TYPES } from "./LeadType";

/**
 * Leads which are unconfirmed and still need more evidence.
 */
export function unfinishedLeads(hasVisibleBoard: HasVisibleBoard): VisibleLead[] {
    return LEAD_TYPES.map(leadType => hasVisibleBoard.board.leads[leadType])
        .filter(leadIsUnfinished);
}
