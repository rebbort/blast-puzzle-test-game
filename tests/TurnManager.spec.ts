import { EventEmitter2 } from "eventemitter2";
import { TurnManager } from "../assets/scripts/core/rules/TurnManager";

describe("TurnManager", () => {
  test("counts down turns and emits TurnUsed", () => {
    const bus = new EventEmitter2();
    const tm = new TurnManager(5, bus);
    const used: number[] = [];
    bus.on("TurnUsed", (left: number) => used.push(left));
    tm.useTurn();
    tm.useTurn();
    tm.useTurn();
    expect(tm.getRemaining()).toBe(2);
    expect(used).toEqual([4, 3, 2]);
  });

  test("OutOfTurns emitted when reaching zero", () => {
    const bus = new EventEmitter2();
    const tm = new TurnManager(2, bus);
    let count = 0;
    bus.on("OutOfTurns", () => count++);
    tm.useTurn();
    expect(count).toBe(0);
    tm.useTurn();
    expect(count).toBe(1);
  });
});
