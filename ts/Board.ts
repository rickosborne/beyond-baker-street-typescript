import { CaseFileCard } from "./CaseFileCard";
import { EVIDENCE_CARDS, EvidenceCard } from "./EvidenceCard";
import { EvidenceType } from "./EvidenceType";
import { EvidenceValue } from "./EvidenceValue";
import { HOLMES_MOVE_IMPOSSIBLE } from "./Game";
import { ImpossibleCard } from "./Impossible";
import { LeadCard, randomLeadCards } from "./LeadCard";
import { LEAD_TYPES, LeadType } from "./LeadType";
import { Pile } from "./Pile";
import { PseudoRNG } from "./rng";
import { toRecord } from "./toRecord";
import { VisibleBoard, VisibleLead } from "./VisibleBoard";

export const LEAD_PILE_START_COUNT = 3;

class BoardLead implements VisibleLead {
	private _confirmed = false;
	private readonly bad = new Pile<EvidenceCard>();
	private readonly good = new Pile<EvidenceCard>();

	constructor(
		public readonly leadType: LeadType,
		private readonly prng: PseudoRNG,
		private readonly leadCards: LeadCard[] = randomLeadCards(leadType, prng),
	) {
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

	public get empty(): boolean {
		return this.leadCards.length === 0;
	}

	public get evidenceCards(): EvidenceCard[] {
		return this.good.toArray();
	}

	public get evidenceValue(): number {
		return this.good.sum(g => g.evidenceValue);
	}

	public get leadCard(): LeadCard {
		return this.leadCards[0];
	}

	public get leadCount(): number {
		return this.leadCards.length;
	}

	public removeAllEvidence(): EvidenceCard[] {
		const allEvidence = this.good.toArray();
		allEvidence.push(...this.bad.toArray());
		this.good.empty();
		this.bad.empty();
		return allEvidence;
	}

	public removeLead(): void {
		this.leadCards.splice(0, 1);
	}
}

export class Board implements VisibleBoard {
	private holmesValue: number;
	private readonly impossible: Pile<ImpossibleCard> = new Pile<ImpossibleCard>();
	private investigationValue: number;
	public readonly leads: Record<LeadType, BoardLead>;
	private readonly remainingEvidence: Pile<EvidenceCard> = new Pile<EvidenceCard>();

	constructor(
		public readonly caseFile: CaseFileCard,
		private readonly prng: PseudoRNG,
	) {
		this.holmesValue = caseFile.holmesStart;
		this.investigationValue = 0;
		this.leads = toRecord(LEAD_TYPES, lt => lt, leadType => new BoardLead(leadType, prng));
		this.init();
	}

	public addBad(leadType: LeadType, evidence: EvidenceCard): void {
		this.leads[leadType].addBad(evidence);
	}

	public addEvidence(leadType: LeadType, evidence: EvidenceCard): void {
		this.leads[leadType].addEvidence(evidence);
	}

	public addImpossible(card: ImpossibleCard): void {
		this.impossible.addToTop(card);
		if (this.impossible.count > this.caseFile.impossibleCount) {
			this.moveHolmes(HOLMES_MOVE_IMPOSSIBLE);
		}
	}

	public get allConfirmed(): boolean {
		return LEAD_TYPES.find(leadType => !this.leads[leadType].confirmed) == null;
	}

	public get anyEmptyLeads(): boolean {
		return LEAD_TYPES.find(leadType => this.leads[leadType].empty) != null;
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

	public dealEvidence(): EvidenceCard | undefined {
		return this.remainingEvidence.takeFromTop();
	}

	public evidenceTypeFor(leadType: LeadType): EvidenceType {
		return this.leadFor(leadType).evidenceType;
	}

	public get holmesLocation(): number {
		return this.holmesValue;
	}

	public get impossibleCards(): ImpossibleCard[] {
		return this.impossible.toArray();
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
		this.remainingEvidence.shuffle(this.prng);
	}

	public get investigationMarker(): number {
		return this.investigationValue;
	}

	public isConfirmed(leadType: LeadType): boolean {
		return this.leads[leadType].confirmed;
	}

	public leadFor(leadType: LeadType): LeadCard {
		return this.leads[leadType].leadCard;
	}

	public moveHolmes(delta: number): void {
		this.holmesValue += delta;
	}

	public moveInvestigationMarker(delta: number): number {
		this.investigationValue += delta;
		return this.investigationValue;
	}

	public get remainingEvidenceCount(): number {
		return this.remainingEvidence.count;
	}

	public removeEvidenceFor(leadType: LeadType): EvidenceCard[] {
		return this.leads[leadType].removeAllEvidence();
	}

	public removeLead(leadType: LeadType): void {
		this.leads[leadType].removeLead();
	}

	public returnEvidence(evidence: EvidenceCard[]): void {
		for (const evidenceCard of evidence) {
			this.remainingEvidence.addToBottom(evidenceCard);
		}
		this.remainingEvidence.shuffle(this.prng);
	}

	public targetForLead(leadType: LeadType): EvidenceValue {
		return this.leadFor(leadType).evidenceTarget;
	}

	// noinspection JSUnusedGlobalSymbols
	public toJSON(): Record<string, unknown> {
		return {
			holmesValue: this.holmesValue,
			impossible: this.impossible,
			investigationValue: this.investigationValue,
			leads: this.leads,
			remainingEvidence: this.remainingEvidence,
		};
	}
}
