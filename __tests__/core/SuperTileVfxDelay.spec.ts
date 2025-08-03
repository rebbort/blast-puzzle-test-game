import { InfrastructureEventBus } from "../../assets/scripts/infrastructure/InfrastructureEventBus";
import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory, TileKind } from "../../assets/scripts/core/board/Tile";
import { MoveExecutor } from "../../assets/scripts/core/board/MoveExecutor";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";
import { EventNames } from "../../assets/scripts/core/events/EventNames";

const cfg: BoardConfig = {
  cols: 1,
  rows: 2,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
};

describe("super-tile VFX delay", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("waits for bomb explosion before falling", async () => {
    jest.useFakeTimers();
    const board = new Board(cfg, [
      [TileFactory.createNormal("red")],
      [TileFactory.createNormal("red")],
    ]);
    board.tileAt(new cc.Vec2(0, 1))!.kind = TileKind.SuperBomb;
    const bus = new InfrastructureEventBus();
    const executor = new MoveExecutor(board, bus);
    let removeTime = 0;
    let fallTime = 0;
    bus.on(EventNames.RemoveStarted, () => {
      removeTime = Date.now();
      bus.emit(EventNames.SuperTileActivated, TileKind.SuperBomb);
    });
    bus.on(EventNames.FallStarted, () => {
      fallTime = Date.now();
    });

    const promise = executor.execute([new cc.Vec2(0, 1)]);

    jest.advanceTimersByTime(399);
    expect(fallTime).toBe(0);
    jest.advanceTimersByTime(1);
    await promise;

    expect(fallTime - removeTime).toBeGreaterThanOrEqual(400);
  });

  it("waits for the longest VFX when multiple supers trigger", async () => {
    jest.useFakeTimers();
    const board = new Board(cfg, [
      [TileFactory.createNormal("red")],
      [TileFactory.createNormal("red")],
    ]);
    board.tileAt(new cc.Vec2(0, 1))!.kind = TileKind.SuperBomb;
    const bus = new InfrastructureEventBus();
    const executor = new MoveExecutor(board, bus);
    let removeTime = 0;
    let fallTime = 0;
    bus.on(EventNames.RemoveStarted, () => {
      removeTime = Date.now();
      bus.emit(EventNames.SuperTileActivated, TileKind.SuperBomb);
      bus.emit(EventNames.SuperTileActivated, TileKind.SuperRow);
    });
    bus.on(EventNames.FallStarted, () => {
      fallTime = Date.now();
    });

    const promise = executor.execute([new cc.Vec2(0, 1)]);

    jest.advanceTimersByTime(449);
    expect(fallTime).toBe(0);
    jest.advanceTimersByTime(1);
    await promise;

    expect(fallTime - removeTime).toBeGreaterThanOrEqual(450);
  });
});
