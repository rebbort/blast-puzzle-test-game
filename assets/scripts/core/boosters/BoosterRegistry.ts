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
  factory: (params: BoosterFactoryParams) => Booster;
}

export const BoosterRegistry: BoosterDefinition[] = [
  {
    id: "teleport",
    factory: ({ board, bus, charges }) =>
      new TeleportBooster(board, bus, charges),
  },
  {
    id: "bomb",
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
