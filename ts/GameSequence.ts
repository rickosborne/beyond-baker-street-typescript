import { GameState, LossReason } from "./Game";
import { InitialSetup } from "./InitialSetup";
import { Outcome } from "./Outcome";

export interface GameSequence {
	readonly endState: GameState;
	readonly initialSetup: InitialSetup;
	readonly lossReason?: LossReason | undefined;
	readonly outcomes: Outcome[];
}
