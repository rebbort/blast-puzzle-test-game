import { InfrastructureEventBus } from "../../../assets/scripts/infrastructure/InfrastructureEventBus";
import { Board } from "../../../assets/scripts/core/board/Board";
import { TileFactory, TileKind } from "../../../assets/scripts/core/board/Tile";
import { BoardConfig } from "../../../assets/scripts/config/ConfigLoader";
import { BoosterService } from "../../../assets/scripts/core/boosters/BoosterService";
import { SuperTileBooster } from "../../../assets/scripts/core/boosters/SuperTileBooster";
import { EventNames } from "../../../assets/scripts/core/events/EventNames";
import TileView from "../../../assets/scripts/ui/views/TileView";

describe("SuperTileBooster", () => {
  const cfg: BoardConfig = {
    cols: 1,
    rows: 1,
    tileWidth: 1,
    tileHeight: 1,
    colors: ["red"],
    superThreshold: 3,
  };

  it("places super tile and consumes charge", () => {
    const bus = new InfrastructureEventBus();
    const svc = new BoosterService(bus, () => "WaitingInput");
    const board = new Board(cfg, [[TileFactory.createNormal("red")]]);
    const view = { apply: jest.fn() } as unknown as TileView;
    const views: TileView[][] = [[view]];
    const getView = (p: cc.Vec2) => views[p.y]?.[p.x];
    const booster = new SuperTileBooster(
      "bomb",
      board,
      getView,
      bus,
      svc,
      1,
      TileKind.SuperBomb,
    );
    svc.register(booster);
    const events: string[] = [];
    bus.on(EventNames.BoosterActivated, () =>
      events.push(EventNames.BoosterActivated),
    );
    bus.on(EventNames.BoosterConsumed, () =>
      events.push(EventNames.BoosterConsumed),
    );
    bus.on(EventNames.SuperTilePlaced, () =>
      events.push(EventNames.SuperTilePlaced),
    );

    svc.activate("bomb");
    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));

    expect(events).toEqual([
      EventNames.BoosterActivated,
      EventNames.BoosterConsumed,
      EventNames.SuperTilePlaced,
    ]);
    expect(booster.charges).toBe(0);
    expect(board.tileAt(new cc.Vec2(0, 0))!.kind).toBe(TileKind.SuperBomb);
    expect(view.apply).toHaveBeenCalled();
  });

  it("does nothing after cancellation", () => {
    const bus = new InfrastructureEventBus();
    const svc = new BoosterService(bus, () => "WaitingInput");
    const board = new Board(cfg, [[TileFactory.createNormal("red")]]);
    const view = { apply: jest.fn() } as unknown as TileView;
    const views: TileView[][] = [[view]];
    const getView = (p: cc.Vec2) => views[p.y]?.[p.x];
    const booster = new SuperTileBooster(
      "bomb",
      board,
      getView,
      bus,
      svc,
      1,
      TileKind.SuperBomb,
    );
    svc.register(booster);

    svc.activate("bomb");
    svc.cancel();
    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));

    expect(booster.charges).toBe(1);
    expect(board.tileAt(new cc.Vec2(0, 0))!.kind).toBe(TileKind.Normal);
    expect(view.apply).not.toHaveBeenCalled();
  });
});
