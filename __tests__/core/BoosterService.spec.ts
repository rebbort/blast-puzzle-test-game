import { ExtendedEventTarget } from "../../assets/scripts/infrastructure/ExtendedEventTarget";
import { BoosterService } from "../../assets/scripts/core/boosters/BoosterService";
import type { Booster } from "../../assets/scripts/core/boosters/Booster";
import { EventNames } from "../../assets/scripts/core/events/EventNames";

describe("BoosterService", () => {
  const bus = new ExtendedEventTarget();
  const emitSpy = jest.spyOn(bus, "emit");

  beforeEach(() => {
    emitSpy.mockClear();
    bus.clear();
  });

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
    const svc = new BoosterService(bus);
    const { booster } = createBooster("bomb");
    svc.register(booster);
    // Access private field for testing via type cast
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (svc as any).boosters as Record<string, Booster>;
    expect(map.bomb).toBe(booster);
  });

  it("activate emits and starts when allowed", () => {
    const svc = new BoosterService(bus);
    const b = createBooster("bomb");
    svc.register(b.booster);
    svc.activate("bomb");
    expect(b.started).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterActivated, "bomb");
  });

  it("activate does nothing when canActivate false", () => {
    const svc = new BoosterService(bus);
    const b = createBooster("bomb", 1, false);
    svc.register(b.booster);
    svc.activate("bomb");
    expect(b.started).toBe(false);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it("consume decreases charges and emits", () => {
    const svc = new BoosterService(bus);
    const { booster } = createBooster("bomb", 2);
    svc.register(booster);
    svc.consume("bomb");
    expect(booster.charges).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterConsumed, "bomb");
  });

  it("cancel emits BoosterCancelled", () => {
    const svc = new BoosterService(bus);
    svc.cancel();
    expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterCancelled);
  });
});
