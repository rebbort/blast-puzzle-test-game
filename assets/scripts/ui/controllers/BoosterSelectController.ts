import { EventBus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import {
  loadBoosterLimits,
  BoosterLimitConfig,
} from "../../config/ConfigLoader";

const { ccclass } = cc._decorator;

interface NodeUtils {
  getChildByName(name: string): NodeUtils | null;
  getComponent(name: string): unknown;
  on(event: string, cb: () => void): void;
  node?: NodeUtils & { active: boolean };
}

/**
 * Popup that lets the player choose up to 2 booster types and up to 10 charges
 * for each (defaults configurable via settings).
 */
@ccclass()
export default class BoosterSelectController extends cc.Component {
  private limits: BoosterLimitConfig = loadBoosterLimits();
  private counts: Record<string, number> = {
    teleport: 0,
    superCol: 0,
    superRow: 0,
    bomb: 0,
  };
  private picked: Set<string> = new Set();
  private labels: Record<string, cc.Label | null> = {
    teleport: null,
    superCol: null,
    superRow: null,
    bomb: null,
  };

  start(): void {
    const root = this.node as unknown as NodeUtils;
    const map: Record<string, string> = {
      teleport: "btnTeleport",
      superCol: "btnSuperCol",
      superRow: "btnSuperRow",
      bomb: "btnBomb",
    };
    (Object.keys(map) as (keyof typeof map)[]).forEach((id) => {
      const btn = root.getChildByName(map[id]);
      btn?.on("click", () => this.inc(id));
      const lbl = btn?.node
        ?.getChildByName("CounterLabel")
        ?.getComponent("Label") as cc.Label | null;
      this.labels[id] = lbl;
      if (lbl) lbl.string = "0";
    });

    root.getChildByName("btnConfirm")?.on("click", () => this.confirm());
  }

  private inc(id: keyof BoosterSelectController["counts"]): void {
    if (this.picked.size >= this.limits.maxTypes && this.counts[id] === 0) {
      return; // cannot pick more types
    }
    const max = this.limits.maxPerType[id];
    if (this.counts[id] >= max) return;
    this.counts[id]++;
    if (this.counts[id] === 1) this.picked.add(id);
    const lbl = this.labels[id];
    if (lbl) lbl.string = String(this.counts[id]);
  }

  private confirm(): void {
    EventBus.emit(EventNames.BoostersSelected, { ...this.counts });
    (this.node as unknown as { active: boolean }).active = false;
  }
}
