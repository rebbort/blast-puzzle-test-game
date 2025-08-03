import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import type { Booster } from "./Booster";
import { EventNames } from "../events/EventNames";
import type { GameState } from "../game/GameStateMachine";

/**
 * Stores all available boosters,
 * handles their activation and publishes events.
 */
export class BoosterService {
  /** Collection of registered boosters by their id. */
  private boosters: Record<string, Booster> = {};
  /** Identifier of the currently active booster, if any. */
  private activeId: string | null = null;

  constructor(
    private bus: InfrastructureEventBus,
    /** Provides the current FSM state to guard activation. */
    private getState: () => GameState,
  ) {}

  /**
   * Registers a new booster.
   * @param boost Instance of the booster to add
   */
  register(boost: Booster): void {
    // Add/overwrite booster by its id
    this.boosters[boost.id] = boost;
  }

  /**
   * Tries to activate a booster by its identifier.
   * Calls canActivate and, if successful, start and publishes the event.
   * @param id Identifier of the booster
   */
  activate(id: string): void {
    const boost = this.boosters[id];
    if (!boost) {
      // Unknown booster — do nothing
      return;
    }

    // If another booster is active, cancel it first
    if (this.activeId && this.activeId !== id) {
      this.cancel();
    }

    // Allow activation only in the WaitingInput state
    if (this.getState() !== "WaitingInput") {
      return;
    }

    // Check if activation is possible in the current state
    if (!boost.canActivate()) {
      return;
    }

    // Switch the game to the mode of selecting cells (or cells)
    boost.start();
    this.activeId = id;
    // Notify subscribers about the activation of a specific booster
    this.bus.emit(EventNames.BoosterActivated, id);
    console.debug(
      "Listeners for BoosterActivated:",
      this.bus.getListenerCount(EventNames.BoosterActivated),
    );
  }

  /**
   * Reduces the charges counter and publishes the BoosterConsumed event.
   * @param id Identifier of the booster
   */
  consume(id: string): void {
    const boost = this.boosters[id];
    if (!boost) {
      // If the booster is not found, simply exit
      return;
    }
    if (boost.charges <= 0) {
      // Nothing to consume, the booster is depleted
      return;
    }
    // Decrease the number of charges
    boost.charges--;
    if (this.activeId === id) {
      this.activeId = null;
    }
    // Notify that the charge has been consumed
    this.bus.emit(EventNames.BoosterConsumed, id);
  }

  /**
   * Cancels the activation mode and publishes the BoosterCancelled event.
   */
  cancel(): void {
    if (this.activeId !== null) {
      this.activeId = null;
    }
    // Notify listeners that the activation has been cancelled
    this.bus.emit(EventNames.BoosterCancelled);
  }

  /**
   * Returns the current number of charges for the booster.
   * @param id Identifier of the booster
   * @returns Number of remaining charges or 0 if the booster is not found
   */
  getCharges(id: string): number {
    const boost = this.boosters[id];
    return boost ? boost.charges : 0;
  }
}
