import { boosterSelectionService } from "../../assets/scripts/ui/services/BoosterSelectionService";
import { BoosterRegistry } from "../../assets/scripts/core/boosters/BoosterRegistry";
import { EventBus } from "../../assets/scripts/core/EventBus";

describe("BoosterSelectionService", () => {
  beforeEach(() => {
    boosterSelectionService.reset();
    EventBus.clear();
  });

  it("assigns max charges (10) for each selected booster", () => {
    const [first, second] = BoosterRegistry;
    boosterSelectionService.toggle(first.id);
    boosterSelectionService.toggle(second.id);
    boosterSelectionService.confirm();
    expect(boosterSelectionService.getConfirmedCharges()).toEqual({
      [first.id]: 10,
      [second.id]: 10,
    });
  });
});
