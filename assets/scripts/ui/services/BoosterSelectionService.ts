import { EventBus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import {
  loadBoosterLimits,
  BoosterLimitConfig,
} from "../../config/ConfigLoader";

/**
 * Service that stores which boosters were chosen on the pre-game popup.
 * Player can select up to `maxTypes` boosters. Selecting more will unselect
 * the oldest choice.
 */
export class BoosterSelectionService {
  private static _instance: BoosterSelectionService | null = null;

  static get instance(): BoosterSelectionService {
    if (!this._instance) {
      this._instance = new BoosterSelectionService();
    }
    return this._instance;
  }

  private limits: BoosterLimitConfig;
  private selected: string[] = [];
  private confirmedCharges: Record<string, number> = {};

  private constructor() {
    this.limits = loadBoosterLimits();
  }

  /**
   * Toggles selection for booster `id`.
   * If selection exceeds the maximum allowed types, the oldest selection is
   * removed.
   * @returns current list of selected booster ids
   */
  toggle(id: string): string[] {
    const idx = this.selected.indexOf(id);
    if (idx !== -1) {
      this.selected.splice(idx, 1);
    } else {
      if (this.selected.length >= this.limits.maxTypes) {
        this.selected.shift();
      }
      this.selected.push(id);
    }
    return this.getSelected();
  }

  getSelected(): string[] {
    return [...this.selected];
  }

  /**
   * Emits event with selected boosters and their charges.
   * Each selected booster starts with the maximum amount allowed by config
   * (defaults to 10).
   */
  confirm(): void {
    const charges: Record<string, number> = {};
    this.selected.forEach((id) => {
      const max = this.limits.maxPerType[id] ?? 10;
      charges[id] = max;
    });
    this.confirmedCharges = charges;
    EventBus.emit(EventNames.BoostersSelected, charges);
  }

  reset(): void {
    this.selected = [];
    this.confirmedCharges = {};
  }

  getConfirmedCharges(): Record<string, number> {
    return { ...this.confirmedCharges };
  }
}

export const boosterSelectionService = BoosterSelectionService.instance;
