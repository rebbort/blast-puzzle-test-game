import { Board } from "../board/Board";
import TileView from "../../ui/views/TileView";
import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import { BoosterService } from "./BoosterService";
import { Booster } from "./Booster";
import { TeleportBooster } from "./TeleportBooster";
import { SuperTileBooster } from "./SuperTileBooster";
import { TileKind } from "../board/Tile";

export interface BoosterFactoryParams {
  board: Board;
  views: TileView[][];
  bus: InfrastructureEventBus;
  boosterService: BoosterService;
  charges: number;
}

export interface BoosterDefinition {
  id: string;
  /** Path to sprite used to represent booster in UI */
  icon: string;
  factory: (params: BoosterFactoryParams) => Booster;
}

export const BoosterRegistry: BoosterDefinition[] = [
  {
    id: "teleport",
    icon: "images/boosters/icon_booster_teleport",
    factory: ({ board, bus, charges }) =>
      new TeleportBooster(board, bus, charges),
  },
  {
    id: "bomb",
    icon: "images/boosters/icon_booster_bomb",
    factory: ({ board, views, bus, boosterService, charges }) =>
      new SuperTileBooster(
        "bomb",
        board,
        views,
        bus,
        boosterService,
        charges,
        TileKind.SuperBomb,
      ),
  },
  {
    id: "superRow",
    icon: "images/boosters/icon_booster_superRow",
    factory: ({ board, views, bus, boosterService, charges }) =>
      new SuperTileBooster(
        "superRow",
        board,
        views,
        bus,
        boosterService,
        charges,
        TileKind.SuperRow,
      ),
  },
  {
    id: "superCol",
    icon: "images/boosters/icon_booster_superCol",
    factory: ({ board, views, bus, boosterService, charges }) =>
      new SuperTileBooster(
        "superCol",
        board,
        views,
        bus,
        boosterService,
        charges,
        TileKind.SuperCol,
      ),
  },
];
