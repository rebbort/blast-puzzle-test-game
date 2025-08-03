import { InfrastructureEventBus } from "../../../assets/scripts/infrastructure/InfrastructureEventBus";
import { BoosterService } from "../../../assets/scripts/core/boosters/BoosterService";
import type { Booster } from "../../../assets/scripts/core/boosters/Booster";
import { SuperTileBooster } from "../../../assets/scripts/core/boosters/SuperTileBooster";
import { Board } from "../../../assets/scripts/core/board/Board";
import { TileFactory, TileKind } from "../../../assets/scripts/core/board/Tile";
import { BoardConfig } from "../../../assets/scripts/config/ConfigLoader";
import { EventNames } from "../../../assets/scripts/core/events/EventNames";
import type { GameState } from "../../../assets/scripts/core/game/GameStateMachine";

describe("BoosterService", () => {
  const bus = new InfrastructureEventBus();
  const emitSpy = jest.spyOn(bus, "emit");

  beforeEach(() => {
    emitSpy.mockClear();
    bus.clear();
  });

  function createSvc(state: GameState = "WaitingInput") {
    return new BoosterService(bus, () => state);
  }

  function createBooster(id: string, charges = 1, activatable = true) {
    let started = false;
    const booster: Booster = {
      id,
      charges,
      canActivate: () => activatable,
      start: () => {
        started = true;
      },
    };
    return {
      booster,
      get started() {
        return started;
      },
    };
  }

  it("register stores booster by id", () => {
    const svc = createSvc();
    const { booster } = createBooster("bomb");
    svc.register(booster);
    // Access private field for testing via type cast
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (svc as any).boosters as Record<string, Booster>;
    expect(map.bomb).toBe(booster);
  });

  it("activate emits and starts when allowed", () => {
    const svc = createSvc();
    const b = createBooster("bomb");
    svc.register(b.booster);
    svc.activate("bomb");
    expect(b.started).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterActivated, "bomb");
  });

  it("activate does nothing when canActivate false", () => {
    const svc = createSvc();
    const b = createBooster("bomb", 1, false);
    svc.register(b.booster);
    svc.activate("bomb");
    expect(b.started).toBe(false);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it("skips activation when state not WaitingInput", () => {
    const svc = createSvc("ExecutingMove");
    const b = createBooster("bomb");
    svc.register(b.booster);
    svc.activate("bomb");
    expect(b.started).toBe(false);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it("consume decreases charges and emits", () => {
    const svc = createSvc();
    const { booster } = createBooster("bomb", 2);
    svc.register(booster);
    svc.consume("bomb");
    expect(booster.charges).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterConsumed, "bomb");
  });

  it("cancel emits BoosterCancelled", () => {
    const svc = createSvc();
    svc.cancel();
    expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterCancelled);
  });

  it("only last activated booster reacts to input", () => {
    const cfg: BoardConfig = {
      cols: 1,
      rows: 1,
      tileWidth: 1,
      tileHeight: 1,
      colors: ["red"],
      superThreshold: 3,
    };
    const board = new Board(cfg, [[TileFactory.createNormal("red")]]);
    const getView = () =>
      undefined as unknown as import("../../../assets/scripts/ui/views/TileView").default;
    const svc = new BoosterService(bus, () => "WaitingInput");
    const a = new SuperTileBooster(
      "a",
      board,
      getView,
      bus,
      svc,
      1,
      TileKind.SuperRow,
    );
    const b = new SuperTileBooster(
      "b",
      board,
      getView,
      bus,
      svc,
      1,
      TileKind.SuperCol,
    );
    svc.register(a);
    svc.register(b);
    svc.activate("a");
    svc.activate("b");
    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    expect(a.charges).toBe(1);
    expect(b.charges).toBe(0);
    expect(board.tileAt(new cc.Vec2(0, 0))!.kind).toBe(TileKind.SuperCol);
  });
});
