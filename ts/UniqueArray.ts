import { removeIf } from "./removeIf";

export type IsSame<T> = (a: T, b: T) => boolean;

export const STRICT_EQUALS: IsSame<unknown> = (a: unknown, b: unknown) => a === b;

export class UniqueArray<T> {
	private readonly _addOne: (item: T) => void;
	private readonly _includes: (item: T) => boolean;
	private readonly _indexOf: (item: T) => number;
	private readonly _removeAt: (index: number) => void;
	private readonly _removeOne: (item: T) => void;
	private readonly itemArray: T[] = [];
	private readonly itemSet: Set<T> = new Set<T>();

	constructor(
		isSame: IsSame<T> = STRICT_EQUALS,
	) {
		if (isSame === STRICT_EQUALS) {
			this._includes = item => this.itemSet.has(item);
			this._indexOf = item => this.itemArray.indexOf(item);
			this._addOne = item => {
				this.itemSet.add(item);
				this.itemArray.push(item);
			};
			this._removeOne = item => {
				this.itemSet.delete(item);
				removeIf(this.itemArray, i => i === item);
			};
			this._removeAt = index => {
				this.itemSet.delete(this.itemArray[index]);
				this.itemArray.splice(index, 1);
			};
		} else {
			this._indexOf = item => this.itemArray.findIndex(i => isSame(i, item));
			this._includes = item => this.itemArray.findIndex(i => isSame(i, item)) >= 0;
			this._addOne = item => this.itemArray.push(item);
			this._removeOne = item => removeIf(this.itemArray, i => isSame(i, item));
			this._removeAt = index => this.itemArray.splice(index, 1);
		}
	}

	public add(...items: T[]): number {
		let addedCount = 0;
		for (const item of items) {
			if (!this._includes(item)) {
				addedCount++;
				this._addOne(item);
			}
		}
		return addedCount;
	}

	public asArray(): T[] {
		return this.itemArray.slice();
	}

	public clear(): void {
		this.itemArray.splice(0, this.itemArray.length);
		this.itemSet.clear();
	}

	public filter(predicate: (item: T, index: number) => boolean): T[] {
		return this.itemArray.filter(predicate);
	}

	public get head(): T | undefined {
		return this.itemArray.length > 0 ? this.itemArray[0] : undefined;
	}

	public includes(item: T): boolean {
		return this._indexOf(item) >= 0;
	}

	public indexOf(item: T): number {
		return this._indexOf(item);
	}

	public get length(): number {
		return this.itemArray.length;
	}

	public map<U>(mapper: (item: T, index: number) => U): U[] {
		return this.itemArray.map(mapper);
	}

	public remove(...items: T[]): number {
		const countBefore = this.itemArray.length;
		for (const item of items) {
			this._removeAt(this._indexOf(item));
		}
		return countBefore - this.itemArray.length;
	}

	public removeAt(index: number): void {
		if (index >= 0 && index < this.itemArray.length) {
			this._removeAt(index);
		}
	}

	public removeIf(predicate: (item: T) => boolean): number {
		let removedCount = 0;
		for (let i = this.itemArray.length - 1; i >= 0; i--) {
			if (predicate(this.itemArray[i])) {
				this._removeAt(i);
				removedCount++;
			}
		}
		return removedCount;
	}
}
