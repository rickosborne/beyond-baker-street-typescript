import { Pile } from "./Pile";
import { LeadCard, randomLeadCards } from "./LeadCard";
import { CaseFileCard } from "./CaseFileCard";
import { EVIDENCE_CARDS, EvidenceCard } from "./EvidenceCard";
import { LEAD_TYPES, LeadType } from "./LeadType";
import { EvidenceValue } from "./EvidenceValue";
import { EvidenceType } from "./EvidenceType";
import { VisibleBoard, VisibleLead } from "./VisibleBoard";
import { toRecord } from "./toRecord";

export const LEAD_PILE_START_COUNT = 3;

class BoardLead implements VisibleLead {
	private _confirmed = false;
	private _leadCard: LeadCard;
	private readonly bad = new Pile<EvidenceCard>();
	private readonly good = new Pile<EvidenceCard>();

	constructor(
		public readonly leadType: LeadType,
		private readonly leadCards: LeadCard[] = randomLeadCards(leadType),
	) {
		this._leadCard = leadCards[0];
	}

	public addBad(evidenceCard: EvidenceCard) {
		this.bad.addToTop(evidenceCard);
	}

	public addEvidence(evidenceCard: EvidenceCard) {
		this.good.addToTop(evidenceCard);
	}

	public get badCards(): EvidenceCard[] {
		return this.bad.toArray();
	}

	public get badValue(): number {
		return this.bad.sum(b => b.evidenceValue);
	}

	public confirm(): void {
		this._confirmed = true;
	}

	public get confirmed(): boolean {
		return this._confirmed;
	}

	public get evidenceCards(): EvidenceCard[] {
		return this.good.toArray();
	}

	public get evidenceValue(): number {
		return this.good.sum(g => g.evidenceValue);
	}

	public get leadCard(): LeadCard {
		return this._leadCard;
	}
}

export class Board implements VisibleBoard {
	private holmesValue: number;
	private readonly impossible: Pile<EvidenceCard> = new Pile<EvidenceCard>();
	private investigationValue: number;
	public readonly leads: Record<LeadType, BoardLead>;
	private readonly remainingEvidence: Pile<EvidenceCard> = new Pile<EvidenceCard>();

	constructor(
		public readonly caseFile: CaseFileCard,
	) {
		this.holmesValue = caseFile.holmesStart;
		this.investigationValue = 0;
		this.leads = toRecord(LEAD_TYPES, lt => lt, leadType => new BoardLead(leadType));
		this.init();
	}

	public addBad(leadType: LeadType, evidence: EvidenceCard): void {
		this.leads[leadType].addBad(evidence);
	}

	public addEvidence(leadType: LeadType, evidence: EvidenceCard): void {
		this.leads[leadType].addEvidence(evidence);
	}

	public addImpossible(evidence: EvidenceCard): void {
		this.impossible.addToTop(evidence);
	}

	public calculateBadFor(leadType: LeadType): number {
		return this.leads[leadType].badValue;
	}

	public calculateEvidenceValueFor(leadType: LeadType): number {
		return this.leads[leadType].evidenceValue;
	}

	public calculateGapFor(leadType: LeadType): number {
		return this.calculateTotalFor(leadType) - this.calculateEvidenceValueFor(leadType);
	}

	public calculateTotalFor(leadType: LeadType): number {
		return this.leadFor(leadType).evidenceTarget + this.calculateBadFor(leadType);
	}

	public confirm(leadType: LeadType): void {
		this.leads[leadType].confirm();
	}

	public evidenceTypeFor(leadType: LeadType): EvidenceType {
		return this.leadFor(leadType).evidenceType;
	}

	public get holmesLocation(): number {
		return this.holmesValue;
	}

	public get impossibleCount(): number {
		return this.impossible.count;
	}

	private init(): void {
		this.remainingEvidence.empty();
		this.impossible.empty();
		for (const evidenceCard of EVIDENCE_CARDS) {
			this.remainingEvidence.addToTop(evidenceCard);
		}
		this.remainingEvidence.shuffle();
	}

	public get investigationMarker(): number {
		return this.investigationValue;
	}

	public isConfirmed(leadType: LeadType): boolean {
		return this.leads[leadType].confirmed;
	}

	protected leadFor(leadType: LeadType): LeadCard {
		return this.leads[leadType].leadCard;
	}

	public moveHolmes(delta: number): void {
		this.holmesValue += delta;
	}

	public get remainingEvidenceCount(): number {
		return this.remainingEvidence.count;
	}

	public targetForLead(leadType: LeadType): EvidenceValue {
		return this.leadFor(leadType).evidenceTarget;
	}
}
