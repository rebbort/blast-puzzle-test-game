import { EventBus } from "../EventBus";
import { BoosterService } from "./BoosterService";
import { SuperTileBooster } from "./SuperTileBooster";
import { Board } from "../board/Board";
import { TileKind } from "../board/Tile";
import TileView from "../../ui/views/TileView";
import type { GameState } from "../game/GameStateMachine";

export let boosterService: BoosterService | undefined;

/**
 * Initializes BoosterService and registers all super-tile boosters.
 * Should be called during game bootstrap once board and views are ready.
 */
export function initBoosterService(
  board: Board,
  views: TileView[][],
  getState: () => GameState,
): void {
  boosterService = new BoosterService(EventBus, getState);
  boosterService.register(
    new SuperTileBooster(
      "bomb",
      board,
      views,
      EventBus,
      boosterService,
      1,
      TileKind.SuperBomb,
    ),
  );
  boosterService.register(
    new SuperTileBooster(
      "superRow",
      board,
      views,
      EventBus,
      boosterService,
      1,
      TileKind.SuperRow,
    ),
  );
  boosterService.register(
    new SuperTileBooster(
      "superCol",
      board,
      views,
      EventBus,
      boosterService,
      1,
      TileKind.SuperCol,
    ),
  );
}
