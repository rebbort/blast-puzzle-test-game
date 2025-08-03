/**
 * Interface of the booster:
 * id       — unique identifier (e.g. 'bomb', 'swap'),
 * charges  — remaining number of uses,
 * canActivate — checks if the booster can be activated in the current state of the field,
 * start    — switches the game to the mode of selecting cells (or cells) for the booster.
 */
export interface Booster {
  /**
   * Unique identifier of the booster.
   * Examples: "bomb", "swap".
   */
  id: string;

  /** Number of remaining uses of the booster. */
  charges: number;

  /**
   * Checks if the booster can be activated in the current state of the game.
   * @returns true if activation is allowed
   */
  canActivate(): boolean;

  /**
   * Switches the game to the mode of selecting cells (or cells)
   * over which the booster will be applied.
   */
  start(): void;
}
