import TileView from "../assets/scripts/ui/views/TileView";
import TileInputController from "../assets/scripts/ui/controllers/TileInputController";
import GameBoardController from "../assets/scripts/ui/controllers/GameBoardController";
import TilePressFeedback from "../assets/scripts/ui/controllers/TilePressFeedback";
import { Board } from "../assets/scripts/core/board/Board";
import { TileFactory } from "../assets/scripts/core/board/Tile";
import { BoardConfig } from "../assets/scripts/config/ConfigLoader";
import { EventBus } from "../assets/scripts/core/EventBus";
import { EventNames } from "../assets/scripts/core/events/EventNames";

beforeEach(() => {
  EventBus.clear();
  // simple stubs for animation helpers
  (
    cc.Node as unknown as { prototype: { runAction: () => void } }
  ).prototype.runAction = () => {};
  (cc as unknown as { scaleTo: () => unknown }).scaleTo = () => ({
    type: "scaleTo",
  });
  (cc as unknown as { sequence: (...a: unknown[]) => unknown }).sequence = (
    ...acts: unknown[]
  ) => ({ type: "seq", acts });
  (cc as unknown as { callFunc: (fn: () => void) => unknown }).callFunc = (
    fn: () => void,
  ) => ({ type: "call", fn });
  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
});

test("tap ignored while falling and during feedback", () => {
  const cfg: BoardConfig = {
    cols: 1,
    rows: 1,
    tileWidth: 1,
    tileHeight: 1,
    colors: ["red"],
    superThreshold: 3,
  };
  const board = new Board(cfg, [[TileFactory.createNormal("red")]]);
  const root = new cc.Node();
  const layer = new cc.Node();
  layer.name = "TilesLayer";
  (root as unknown as { children: cc.Node[] }).children.push(layer);
  (
    root as unknown as { getChildByName: (n: string) => cc.Node | null }
  ).getChildByName = (n: string) => (n === "TilesLayer" ? layer : null);

  const boardCtrl = root.addComponent(GameBoardController);
  (boardCtrl as unknown as { board: Board }).board = board;
  boardCtrl.tilesLayer = layer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  boardCtrl.tileNodePrefab = new (cc.Prefab as any)("TileNode", TileView);
  (boardCtrl as unknown as { spawnAllTiles: () => void }).spawnAllTiles();

  const input = layer.addComponent(TileInputController);
  (input as unknown as { boardCtrl: GameBoardController }).boardCtrl =
    boardCtrl;

  const feedback = root.addComponent(TilePressFeedback);
  (
    feedback as unknown as { getComponent: (Ctor: unknown) => unknown }
  ).getComponent = (Ctor: unknown) =>
    Ctor === GameBoardController ? boardCtrl : null;
  (feedback as { onLoad: () => void }).onLoad();

  // Re-emit TilePressed when GroupSelected occurs to trigger feedback
  EventBus.on(EventNames.GroupSelected, (p: cc.Vec2) => {
    EventBus.emit(EventNames.TilePressed, p);
  });

  const emitSpy = jest.spyOn(EventBus, "emit");
  const view = boardCtrl.tileViews[0][0];

  // falling state blocks tap
  view.startFall();
  input.handleTap(0, 0);
  const gsCalls = () =>
    emitSpy.mock.calls.filter((c) => c[0] === EventNames.GroupSelected).length;
  expect(gsCalls()).toBe(0);
  view.endFall();

  // first valid tap
  input.handleTap(0, 0);
  expect(gsCalls()).toBe(1);
  const calls = gsCalls();

  // feedback active prevents another tap
  view["isFeedbackActive"] = true;
  input.handleTap(0, 0);
  expect(gsCalls()).toBe(calls);

  // after feedback finished tap works again
  view["isFeedbackActive"] = false;
  input.handleTap(0, 0);
  expect(gsCalls()).toBe(calls + 1);
});
