import { EventBus } from "../EventBus";
import { BoosterService } from "./BoosterService";
import { Board } from "../board/Board";
import TileView from "../../ui/views/TileView";
import type { GameState } from "../game/GameStateMachine";
import { BoosterRegistry } from "./BoosterRegistry";

export let boosterService: BoosterService | undefined;

/**
 * Initializes BoosterService and registers all super-tile boosters.
 * Should be called during game bootstrap once board and views are ready.
 */
export function initBoosterService(
  board: Board,
  viewProvider: () => TileView[][],
  getState: () => GameState,
  charges: Record<string, number>,
): void {
  boosterService = new BoosterService(EventBus, getState);
  const getView = (p: cc.Vec2): TileView | undefined => {
    const views = viewProvider();
    return views[p.y]?.[p.x];
  };
  BoosterRegistry.forEach((def) => {
    const boost = def.factory({
      board,
      getView,
      bus: EventBus,
      boosterService,
      charges: charges[def.id] ?? 0,
    });
    boosterService.register(boost);
  });
}
