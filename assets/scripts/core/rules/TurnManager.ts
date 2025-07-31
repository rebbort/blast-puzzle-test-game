import { EventBus } from "../../infrastructure/EventBus";
import { EventNames } from "../events/EventNames";
export class TurnManager {
  /** Remaining turns in the current session. */
  private turnsLeft: number;

  /**
   * Creates a turn manager with the given initial amount of turns.
   * @param initialTurns Starting number of turns
   * @param bus Event bus used to emit turn related events
   */
  constructor(
    initialTurns: number,
    private bus: EventBus,
  ) {
    this.turnsLeft = initialTurns;
  }

  /**
   * Consumes one turn and notifies listeners.
   *
   * Emits `TurnUsed` with remaining turns after decrement. When no turns
   * remain the `OutOfTurns` event is emitted once the count reaches zero.
   */
  useTurn(): void {
    this.turnsLeft--;
    this.bus.emit(EventNames.TurnUsed, this.turnsLeft);
    if (this.turnsLeft === 0) {
      this.bus.emit(EventNames.OutOfTurns);
    }
  }

  /**
   * Returns the number of turns still available.
   */
  getRemaining(): number {
    return this.turnsLeft;
  }
}
