import { isDefined } from "./util/defined";
import { ActivePlayer } from "./Player";

export interface MightCheat {
	cheats: boolean;
}

export function mightCheat<C extends MightCheat>(maybe: unknown): maybe is C {
	// noinspection SuspiciousTypeOfGuard
	return isDefined(maybe) && (typeof (maybe as MightCheat).cheats === "boolean");
}

export interface CheatingActivePlayer extends ActivePlayer, MightCheat {
}

export function isCheatingActivePlayer(maybe: unknown): maybe is CheatingActivePlayer {
	return mightCheat<CheatingActivePlayer>(maybe)
		&& (typeof maybe.sawEvidenceDealt === "function")
		&& maybe.cheats;
}
