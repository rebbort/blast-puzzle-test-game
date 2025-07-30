import { ExtendedEventTarget } from "../../assets/scripts/infrastructure/ExtendedEventTarget";
import { TurnManager } from "../../assets/scripts/core/rules/TurnManager";

let bus: ExtendedEventTarget;
let emitSpy: jest.SpyInstance;
beforeAll(() => {
  bus = new ExtendedEventTarget();
  emitSpy = jest.spyOn(bus, "emit");
});

beforeEach(() => {
  emitSpy.mockClear();
  bus.removeAllListeners();
});

// turns decrease and event emitted
it("useTurn decreases remaining turns", () => {
  const tm = new TurnManager(3, bus);
  tm.useTurn();
  tm.useTurn();
  expect(tm.getRemaining()).toBe(1);
  expect(emitSpy).toHaveBeenCalledTimes(2);
});

// last turn triggers OutOfTurns
it("emits OutOfTurns when reaching zero", () => {
  const tm = new TurnManager(1, bus);
  let called = 0;
  bus.on("OutOfTurns", () => called++);
  tm.useTurn();
  expect(called).toBe(1);
});

// starting with many turns stays positive
it("getRemaining returns initial value", () => {
  const tm = new TurnManager(5, bus);
  expect(tm.getRemaining()).toBe(5);
});
