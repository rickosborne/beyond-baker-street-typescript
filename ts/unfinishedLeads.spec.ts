import { expect } from "chai";
import { describe } from "mocha";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { leadCard } from "./LeadCard";
import { LeadType } from "./LeadType";
import { unfinishedLeads } from "./unfinishedLeads";
import { HasVisibleBoard, VisibleLead } from "./VisibleBoard";

function lead(
	leadType: LeadType,
	evidenceType: EvidenceType,
	evidenceTarget: number,
	evidenceValue = 0,
	confirmed = false,
	badValue = 0,
): VisibleLead {
	return <VisibleLead> {
		badCards: [] as EvidenceCard[],
		badValue,
		confirmed,
		evidenceCards: [] as EvidenceCard[],
		evidenceValue,
		leadCard: leadCard(leadType, evidenceType, evidenceTarget),
	};
}

const notStarted = lead(LeadType.Motive, EvidenceType.Track, 7);
const readyToConfirm = lead(LeadType.Suspect, EvidenceType.Track, 7, 7);
const confirmed = lead(LeadType.Opportunity, EvidenceType.Track, 7, 7, true);
const readyWithBad = lead(LeadType.Opportunity, EvidenceType.Track, 9, 7, false, 2);

describe("unfinishedLeads", function () {
	it("does what it says", function () {
		expect(unfinishedLeads(<HasVisibleBoard> {
			board: {
				leads: {
					[LeadType.Motive]: notStarted,
					[LeadType.Opportunity]: confirmed,
					[LeadType.Suspect]: readyToConfirm,
				},
			},
		})).deep.includes.members([notStarted]);
		expect(unfinishedLeads(<HasVisibleBoard> {
			board: {
				leads: {
					[LeadType.Motive]: notStarted,
					[LeadType.Opportunity]: readyWithBad,
					[LeadType.Suspect]: readyToConfirm,
				},
			},
		})).deep.includes.members([notStarted]);
	});
});
