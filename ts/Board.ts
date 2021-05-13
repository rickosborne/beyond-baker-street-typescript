import { BaskervilleAction } from "./Baskerville";
import { CASE_FILE_CARDS, CaseFileCard } from "./CaseFileCard";
import { EVIDENCE_CARDS, EvidenceCard, formatEvidence, isEvidenceCard, isSameEvidenceCard } from "./EvidenceCard";
import { EvidenceValue } from "./EvidenceValue";
import { HOLMES_GOAL, HOLMES_MAX, HOLMES_MOVE_PROGRESS, INVESTIGATION_MARKER_GOAL } from "./Game";
import { ImpossibleCard } from "./Impossible";
import { LeadCard, randomLeadCards } from "./LeadCard";
import { LEAD_COUNT, LEAD_TYPES, LeadType } from "./LeadType";
import { Pile } from "./Pile";
import { DEFAULT_PRNG, PseudoRNG } from "./rng";
import { BottomOrTop } from "./Toby";
import { toRecord } from "./toRecord";
import { VisibleBoard, VisibleLead } from "./VisibleBoard";

export const LEAD_PILE_START_COUNT = 3;

export class BoardLead implements VisibleLead {
	private _confirmed = false;
	private readonly bad = new Pile<EvidenceCard>();
	private readonly good = new Pile<EvidenceCard>();

	constructor(
		public readonly leadType: LeadType,
		private readonly prng: PseudoRNG = DEFAULT_PRNG,
		private readonly leadCards: LeadCard[] = randomLeadCards(leadType, prng),
	) {
	}

	public addEvidence(evidenceCard: EvidenceCard): BadOrGood {
		if (evidenceCard.evidenceType === this.leadCard.evidenceType) {
			this.good.addToTop(evidenceCard);
			return BadOrGood.Good;
		} else {
			this.bad.addToTop(evidenceCard);
			return BadOrGood.Bad;
		}
	}

	public get badCards(): EvidenceCard[] {
		return this.bad.toArray();
	}

	public get badValue(): number {
		return this.bad.sum(b => b.evidenceValue);
	}

	public baskervilleSwap(leadEvidence: EvidenceCard, impossibleEvidence: EvidenceCard): void {
		const fromPile = this.pileForEvidence(leadEvidence);
		const removed = fromPile.removeIf(c => isSameEvidenceCard(c, leadEvidence));
		if (removed !== 1) {
			throw new Error(`Pile should have had ${formatEvidence(leadEvidence)}`);
		}
		this.pileForEvidence(impossibleEvidence).addToTop(impossibleEvidence);
	}

	public confirm(): void {
		if ((this.badValue + this.leadCard.evidenceTarget) !== this.evidenceValue) {
			throw new Error(`Tried to confirm a lead where the evidence doesn't add up`);
		}
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

	public includes(evidenceCard: EvidenceCard): boolean {
		return this.pileForEvidence(evidenceCard).find(c => isSameEvidenceCard(c, evidenceCard)) != null;
	}

	public get leadCard(): LeadCard {
		return this.leadCards[0];
	}

	public get leadCount(): number {
		return this.leadCards.length;
	}

	private pileForEvidence(evidenceCard: EvidenceCard): Pile<EvidenceCard> {
		return evidenceCard.evidenceType === this.leadCard.evidenceType ? this.good : this.bad;
	}

	public removeAllEvidence(): EvidenceCard[] {
		const allEvidence = this.good.toArray();
		allEvidence.push(...this.bad.toArray());
		this.good.empty();
		this.bad.empty();
		return allEvidence;
	}

	public removeLead(): void {
		if (this.leadCards.length === 0) {
			throw new Error(`Already out of leads!`);
		}
		this.leadCards.splice(0, 1);
	}
}

export enum BadOrGood {
	Bad = "Bad",
	Good = "Good",
}

export class Board implements VisibleBoard {
	private _confirmedCount = 0;
	private _impossibleLimit: number;
	private holmesValue: number;
	private readonly impossible: Pile<ImpossibleCard> = new Pile<ImpossibleCard>();
	private investigationValue: number;
	private readonly remainingEvidence: Pile<EvidenceCard> = new Pile<EvidenceCard>();

	constructor(
		public readonly caseFile: CaseFileCard = CASE_FILE_CARDS[0],
		private readonly prng: PseudoRNG = DEFAULT_PRNG,
		public readonly leads: Record<LeadType, BoardLead> = toRecord(LEAD_TYPES, lt => lt, leadType => new BoardLead(leadType, prng)),
	) {
		this.holmesValue = caseFile.holmesStart;
		this.investigationValue = 0;
		this._impossibleLimit = caseFile.impossibleLimit;
		this.init();
	}

	public addEvidence(leadType: LeadType, evidence: EvidenceCard): BadOrGood {
		return this.leads[leadType].addEvidence(evidence);
	}

	public addImpossible(
		card: ImpossibleCard,
		moveHolmes = true,
	): void {
		this.impossible.addToTop(card);
		if ((this.impossible.count > this._impossibleLimit) && moveHolmes) {
			this.moveHolmes(HOLMES_MOVE_PROGRESS);
		}
		if (isEvidenceCard(card)) {
			this.investigationValue += card.evidenceValue;
		}
	}

	public get allConfirmed(): boolean {
		return this._confirmedCount === LEAD_COUNT;
	}

	public get anyEmptyLeads(): boolean {
		return LEAD_TYPES.find(leadType => this.leads[leadType].empty) != null;
	}

	public baskervilleSwap(action: BaskervilleAction): number {
		const impossibleEvidence = action.impossibleEvidence;
		if (this.impossible.find(c => isEvidenceCard(c) && isSameEvidenceCard(c, impossibleEvidence)) == null) {
			throw new Error(`Not impossible: ${formatEvidence(impossibleEvidence)}`);
		}
		const leadEvidence = action.leadEvidence;
		const lead = this.leads[action.leadType];
		if (!lead.includes(leadEvidence)) {
			throw new Error(`Not on the lead: ${formatEvidence(leadEvidence)}`);
		}
		this.impossible.swapOne(leadEvidence, c => isEvidenceCard(c) && isSameEvidenceCard(c, impossibleEvidence));
		lead.baskervilleSwap(leadEvidence, impossibleEvidence);
		const investigationDelta = leadEvidence.evidenceValue - impossibleEvidence.evidenceValue;
		this.moveInvestigationMarker(investigationDelta);
		return investigationDelta;
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
		const lead = this.leads[leadType];
		if (lead.confirmed) {
			throw new Error(`Lead ${leadType} is already confirmed.`);
		}
		lead.confirm();
		this._confirmedCount++;
	}

	public dealEvidence(): EvidenceCard | undefined {
		return this.remainingEvidence.takeFromTop();
	}

	public get holmesWon(): boolean {
		return this.holmesValue === HOLMES_GOAL;
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

	public get impossibleLimit(): number {
		return this._impossibleLimit;
	}

	private init(): void {
		this.remainingEvidence.empty();
		this.impossible.empty();
		for (const evidenceCard of EVIDENCE_CARDS) {
			this.remainingEvidence.addToTop(evidenceCard);
		}
		this.remainingEvidence.shuffle(this.prng);
	}

	public get investigationComplete(): boolean {
		return this.investigationValue === INVESTIGATION_MARKER_GOAL;
	}

	public get investigationMarker(): number {
		return this.investigationValue;
	}

	public get investigationOver(): boolean {
		return this.investigationValue > INVESTIGATION_MARKER_GOAL;
	}

	public isConfirmed(leadType: LeadType): boolean {
		return this.leads[leadType].confirmed;
	}

	public leadFor(leadType: LeadType): LeadCard {
		return this.leads[leadType].leadCard;
	}

	public moveHolmes(delta: number): number {
		this.holmesValue = Math.max(Math.min(this.holmesValue + delta, HOLMES_MAX), HOLMES_GOAL);
		return this.holmesValue;
	}

	public moveInvestigationMarker(delta: number): number {
		this.investigationValue += delta;
		return this.investigationValue;
	}

	public raiseImpossibleLimitBy1(): void {
		this._impossibleLimit++;
	}

	public get remainingEvidenceCount(): number {
		return this.remainingEvidence.count;
	}

	public removeEvidenceFor(leadType: LeadType): EvidenceCard[] {
		return this.leads[leadType].removeAllEvidence();
	}

	public removeFromImpossible(impossibleEvidence: EvidenceCard): void {
		const count = this.impossible.removeIf(c => isEvidenceCard(c) && isSameEvidenceCard(c, impossibleEvidence));
		if (count !== 1) {
			throw new Error(`Not impossible: ${formatEvidence(impossibleEvidence)}`);
		}
		this.investigationValue -= impossibleEvidence.evidenceValue;
	}

	public removeLead(leadType: LeadType): void {
		this.leads[leadType].removeLead();
	}

	public returnEvidence(
		evidence: EvidenceCard[],
		shuffle: boolean,
		bottomOrTop: BottomOrTop,
	): void {
		for (const evidenceCard of evidence) {
			if (bottomOrTop === BottomOrTop.Top) {
				this.remainingEvidence.addToTop(evidenceCard);
			} else {
				this.remainingEvidence.addToBottom(evidenceCard);
			}
		}
		if (shuffle) {
			this.remainingEvidence.shuffle(this.prng);
		}
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
