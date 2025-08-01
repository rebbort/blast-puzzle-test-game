import TilePressFeedback from "../assets/scripts/ui/controllers/TilePressFeedback";
import GameBoardController from "../assets/scripts/ui/controllers/GameBoardController";
import TileView from "../assets/scripts/ui/views/TileView";
import { EventBus } from "../assets/scripts/core/EventBus";
import { EventNames } from "../assets/scripts/core/events/EventNames";

beforeEach(() => {
  EventBus.clear();
  // stub actions for animation
  (
    cc.Node as unknown as { prototype: { runAction: () => void } }
  ).prototype.runAction = () => {};
  (cc as unknown as { scaleTo: () => unknown }).scaleTo = () => ({
    type: "scaleTo",
  });
  (cc as unknown as { sequence: (...a: unknown[]) => unknown }).sequence = (
    ...acts: unknown[]
  ) => ({ type: "seq", acts });
});

test("TilePressFeedback forwards TilePressed to view", () => {
  const viewNode = new cc.Node();
  const view = viewNode.addComponent(TileView);
  const boardCtrl = { tileViews: [[view]] } as unknown as GameBoardController;

  const comp = new TilePressFeedback();
  (comp as unknown as { node: cc.Node }).node = new cc.Node();
  (comp as { getComponent: (Ctor: unknown) => unknown }).getComponent = (
    Ctor: unknown,
  ) => (Ctor === GameBoardController ? boardCtrl : null);

  (comp as { onLoad: () => void }).onLoad();

  const spy = jest.spyOn(view, "pressFeedback");
  EventBus.emit(EventNames.TilePressed, new cc.Vec2(0, 0));

  expect(spy).toHaveBeenCalled();
});
