// Тесты больше не используют eventemitter2, вместо него наш EventBus
import { InfrastructureEventBus } from "../assets/scripts/infrastructure/InfrastructureEventBus";
import { TurnManager } from "../assets/scripts/core/rules/TurnManager";
import { EventNames } from "../assets/scripts/core/events/EventNames";

describe("TurnManager", () => {
  test("counts down turns and emits TurnUsed", () => {
    const bus = new InfrastructureEventBus();
    const tm = new TurnManager(5, bus);
    const used: number[] = [];
    bus.on(EventNames.TurnUsed, (left) => used.push(left as number));
    tm.useTurn();
    tm.useTurn();
    tm.useTurn();
    expect(tm.getRemaining()).toBe(2);
    expect(used).toEqual([4, 3, 2]);
  });

  test("OutOfTurns emitted when reaching zero", () => {
    const bus = new InfrastructureEventBus();
    const tm = new TurnManager(2, bus);
    let count = 0;
    bus.on(EventNames.OutOfTurns, () => count++);
    tm.useTurn();
    expect(count).toBe(0);
    tm.useTurn();
    expect(count).toBe(1);
  });

  test("reset restores initial turn count", () => {
    const bus = new InfrastructureEventBus();
    const tm = new TurnManager(3, bus);
    tm.useTurn();
    expect(tm.getRemaining()).toBe(2);
    tm.reset();
    expect(tm.getRemaining()).toBe(3);
  });
});
