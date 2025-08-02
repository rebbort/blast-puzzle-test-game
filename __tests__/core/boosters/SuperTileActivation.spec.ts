import { InfrastructureEventBus } from "../../../assets/scripts/infrastructure/InfrastructureEventBus";
import { Board } from "../../../assets/scripts/core/board/Board";
import { BoardSolver } from "../../../assets/scripts/core/board/BoardSolver";
import { MoveExecutor } from "../../../assets/scripts/core/board/MoveExecutor";
import { TileFactory, TileKind } from "../../../assets/scripts/core/board/Tile";
import { BoardConfig } from "../../../assets/scripts/config/ConfigLoader";
import { ScoreStrategyQuadratic } from "../../../assets/scripts/core/rules/ScoreStrategyQuadratic";
import { TurnManager } from "../../../assets/scripts/core/rules/TurnManager";
import { GameStateMachine } from "../../../assets/scripts/core/game/GameStateMachine";
import { EventNames } from "../../../assets/scripts/core/events/EventNames";

const cfg: BoardConfig = {
  cols: 3,
  rows: 3,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
};

async function activate(
  kind: TileKind,
): Promise<{ events: string[]; removed: cc.Vec2[] }> {
  const tiles = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => TileFactory.createNormal("red")),
  );
  tiles[1][1].kind = kind;
  const board = new Board(cfg, tiles);
  const bus = new InfrastructureEventBus();
  const solver = new BoardSolver(board);
  const exec = new MoveExecutor(board, bus);
  const strategy = new ScoreStrategyQuadratic(1);
  const tm = new TurnManager(5, bus);
  const fsm = new GameStateMachine(
    bus,
    board,
    solver,
    exec,
    strategy,
    tm,
    0,
    0,
  );
  const events: string[] = [];
  let removed: cc.Vec2[] = [];
  bus.on(EventNames.BoosterConfirmed, () =>
    events.push(EventNames.BoosterConfirmed),
  );
  bus.on(EventNames.RemoveStarted, (g: cc.Vec2[]) => (removed = g));
  bus.on(EventNames.TilesRemoved, () => events.push(EventNames.TilesRemoved));
  bus.on(EventNames.MoveCompleted, () => events.push(EventNames.MoveCompleted));
  fsm.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 1));
  await new Promise((r) => setImmediate(r));
  return { events, removed };
}

describe("super tile activation", () => {
  it("activates SuperRow clearing row", async () => {
    const { events, removed } = await activate(TileKind.SuperRow);
    expect(events).toEqual([
      EventNames.BoosterConfirmed,
      EventNames.TilesRemoved,
      EventNames.MoveCompleted,
    ]);
    const coords = removed.map((p) => `${p.x},${p.y}`).sort();
    expect(coords).toEqual(["0,1", "1,1", "2,1"]);
  });

  it("activates SuperCol clearing column", async () => {
    const { events, removed } = await activate(TileKind.SuperCol);
    expect(events).toEqual([
      EventNames.BoosterConfirmed,
      EventNames.TilesRemoved,
      EventNames.MoveCompleted,
    ]);
    const coords = removed.map((p) => `${p.x},${p.y}`).sort();
    expect(coords).toEqual(["1,0", "1,1", "1,2"]);
  });

  it("activates SuperBomb clearing area", async () => {
    const { events, removed } = await activate(TileKind.SuperBomb);
    expect(events).toEqual([
      EventNames.BoosterConfirmed,
      EventNames.TilesRemoved,
      EventNames.MoveCompleted,
    ]);
    const coords = removed.map((p) => `${p.x},${p.y}`).sort();
    expect(coords).toEqual([
      "0,0",
      "0,1",
      "0,2",
      "1,0",
      "1,1",
      "1,2",
      "2,0",
      "2,1",
      "2,2",
    ]);
  });
});
