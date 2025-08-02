import { EventBus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import {
  loadBoosterLimits,
  BoosterLimitConfig,
} from "../../config/ConfigLoader";
import { BoosterRegistry } from "../../core/boosters/BoosterRegistry";

export class BoosterSelectionService {
  private static _instance: BoosterSelectionService | null = null;

  static get instance(): BoosterSelectionService {
    if (!this._instance) {
      this._instance = new BoosterSelectionService();
    }
    return this._instance;
  }

  private limits: BoosterLimitConfig;
  private counts: Record<string, number> = {};
  private picked: Set<string> = new Set();

  private constructor() {
    this.limits = loadBoosterLimits();
    BoosterRegistry.forEach((def) => {
      this.counts[def.id] = 0;
    });
  }

  /**
   * Increment count for booster `id` if within limits.
   * @returns new count value
   */
  inc(id: string): number {
    if (this.picked.size >= this.limits.maxTypes && this.counts[id] === 0) {
      return this.counts[id];
    }
    const max = this.limits.maxPerType[id] ?? 0;
    if (this.counts[id] >= max) return this.counts[id];
    this.counts[id]++;
    if (this.counts[id] === 1) this.picked.add(id);
    return this.counts[id];
  }

  getCount(id: string): number {
    return this.counts[id] ?? 0;
  }

  getCounts(): Record<string, number> {
    return { ...this.counts };
  }

  confirm(): void {
    EventBus.emit(EventNames.BoostersSelected, { ...this.counts });
  }

  reset(): void {
    Object.keys(this.counts).forEach((id) => (this.counts[id] = 0));
    this.picked.clear();
  }
}

export const boosterSelectionService = BoosterSelectionService.instance;
