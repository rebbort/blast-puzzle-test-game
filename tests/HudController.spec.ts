import { HudController } from "../assets/scripts/ui/HudController";
import { EventBus } from "../assets/scripts/core/EventBus";
import { EventNames } from "../assets/scripts/core/events/EventNames";

interface NodeStub {
  getChildByName?(name: string): NodeStub | null;
  getComponent(name: string): unknown;
  on?(event: string, cb: () => void): void;
  node?: NodeStub;
}

beforeEach(() => {
  EventBus.clear();
});

test("updates state label on StateChanged", () => {
  const label: { string: string } = { string: "" };
  const labelNode: NodeStub = {
    getComponent: (n: string) => (n === "Label" ? label : null),
  };
  const root: NodeStub = {
    getChildByName: (n: string) => (n === "lblState" ? labelNode : null),
    getComponent: () => null,
    on: () => {},
  };

  const hud = new HudController();
  (hud as unknown as { node: NodeStub }).node = root;
  hud.start();

  EventBus.emit(EventNames.StateChanged, "ExecutingMove");
  expect(label.string).toBe("ExecutingMove");
});
