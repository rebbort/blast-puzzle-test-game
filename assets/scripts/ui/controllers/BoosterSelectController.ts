import { EventBus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import {
  loadBoosterLimits,
  BoosterLimitConfig,
} from "../../config/ConfigLoader";
import BoosterSelectAnimationController from "./BoosterSelectAnimationController";

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

  private animationController: BoosterSelectAnimationController = null;

  start(): void {
    // Получаем анимационный контроллер
    this.animationController = this.getComponent(
      BoosterSelectAnimationController,
    );

    const root = this.node as unknown as NodeUtils;
    const map: Record<string, string> = {
      teleport: "btnTeleport",
      superCol: "btnSuperCol",
      superRow: "btnSuperRow",
      bomb: "btnBomb",
    };
    (Object.keys(map) as (keyof typeof map)[]).forEach((id) => {
      const btn = root.getChildByName(map[id]);
      btn?.on(cc.Node.EventType.TOUCH_END, () => this.inc(id));
      const lbl = btn?.node
        ?.getChildByName("CounterLabel")
        ?.getComponent("Label") as cc.Label | null;
      this.labels[id] = lbl;
      if (lbl) lbl.string = "0";
    });

    root.getChildByName("btnConfirm")?.on("click", () => this.confirm());

    // Добавляем обработчик клика на PlayButton
    const playButton = root.getChildByName("PlayButton");
    playButton.on(cc.Node.EventType.TOUCH_END, () => this.startGame());

    // Запускаем анимацию появления
    if (this.animationController) {
      this.animationController.playEntranceAnimation();
    }
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

  /**
   * Запускает игру при клике на PlayButton
   */
  private startGame(): void {
    console.log("🎮 PlayButton clicked - starting game...");
    console.log("Current booster counts:", this.counts);

    // Отправляем событие о запуске игры
    EventBus.emit(EventNames.BoostersSelected, { ...this.counts });
    console.log("✅ BoostersSelected event emitted");
  }

  /**
   * Перезапускает анимацию появления
   */
  public replayAnimation(): void {
    if (this.animationController) {
      this.animationController.replayAnimation();
    }
  }

  /**
   * Показывает все элементы без анимации
   */
  public showImmediately(): void {
    if (this.animationController) {
      this.animationController.showAllImmediately();
    }
  }
}
