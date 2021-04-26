import { Action } from "./Action";
import { ActionType } from "./ActionType";
import { Player } from "./Player";

export interface Outcome {
	action: Action<ActionType>;
	activePlayer: Player;
}
