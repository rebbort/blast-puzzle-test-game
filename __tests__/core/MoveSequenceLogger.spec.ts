import { InfrastructureEventBus } from "../../assets/scripts/infrastructure/InfrastructureEventBus";
import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";
import { EventNames } from "../../assets/scripts/core/events/EventNames";
import { MoveSequenceLogger } from "../../assets/scripts/core/diagnostics/MoveSequenceLogger";

const cfg: BoardConfig = {
  cols: 1,
  rows: 1,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
};

describe("MoveSequenceLogger", () => {
  jest.useFakeTimers();

  it("warns when FillDone is missing", () => {
    const bus = new InfrastructureEventBus();
    const board = new Board(cfg, [[TileFactory.createNormal("red")]]);
    const warn = jest.spyOn(console, "warn").mockImplementation();
    new MoveSequenceLogger(bus, board);

    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    bus.emit(EventNames.FillStarted, []);
    jest.advanceTimersByTime(700);

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("clears timeout when FillDone arrives", () => {
    const bus = new InfrastructureEventBus();
    const board = new Board(cfg, [[TileFactory.createNormal("red")]]);
    const warn = jest.spyOn(console, "warn").mockImplementation();
    new MoveSequenceLogger(bus, board);

    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    bus.emit(EventNames.FillStarted, []);
    jest.advanceTimersByTime(300);
    bus.emit(EventNames.FillDone, [], []);
    jest.advanceTimersByTime(400);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
