import BoosterSelectAnimationController from "./BoosterSelectAnimationController";
import { BoosterRegistry } from "../../core/boosters/BoosterRegistry";
import { boosterSelectionService } from "../services/BoosterSelectionService";

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
  private labels: Record<string, cc.Label | null> = {};

  private animationController: BoosterSelectAnimationController = null;

  start(): void {
    // Получаем анимационный контроллер
    this.animationController = this.getComponent(
      BoosterSelectAnimationController,
    );

    const root = this.node as unknown as NodeUtils;
    boosterSelectionService.reset();
    BoosterRegistry.forEach((def) => {
      const id = def.id;
      const btnName = `btn${id.charAt(0).toUpperCase()}${id.slice(1)}`;
      const btn = root.getChildByName(btnName);
      btn?.on(cc.Node.EventType.TOUCH_END, () => this.inc(id));
      const lbl = btn?.node
        ?.getChildByName("CounterLabel")
        ?.getComponent("Label") as cc.Label | null;
      this.labels[id] = lbl;
      if (lbl) lbl.string = String(boosterSelectionService.getCount(id));
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

  private inc(id: string): void {
    const count = boosterSelectionService.inc(id);
    const lbl = this.labels[id];
    if (lbl) lbl.string = String(count);
  }

  private confirm(): void {
    boosterSelectionService.confirm();
    (this.node as unknown as { active: boolean }).active = false;
  }

  /**
   * Запускает игру при клике на PlayButton
   */
  private startGame(): void {
    console.log("🎮 PlayButton clicked - starting game...");
    console.log("Current booster counts:", boosterSelectionService.getCounts());

    // Отправляем событие о запуске игры
    this.confirm();
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
