import { EventBus } from "../core/EventBus";
const { ccclass } = cc._decorator;

interface NodeUtils {
  getChildByName(name: string): NodeUtils | null;
  getComponent(name: string): unknown;
  node?: { active: boolean };
}

/**
 * Handles pause/resume events for the game scene.
 * director.pause stops the entire engine including timers and animations,
 * while simply blocking input would let those continue running.
 */
@ccclass()
export class GameSceneController extends cc.Component {
  private popup: { node: { active: boolean } } | null = null;

  start(): void {
    const root = this.node as NodeUtils;
    this.popup = root
      .getChildByName("PopupPause")
      ?.getComponent("PopupPause") as {
      node: { active: boolean };
    } | null;
    if (this.popup?.node) this.popup.node.active = false;

    EventBus.on("GamePaused", () => {
      cc.director.pause();
      if (this.popup?.node) this.popup.node.active = true;
    });

    EventBus.on("GameResumed", () => {
      cc.director.resume();
      if (this.popup?.node) this.popup.node.active = false;
    });
  }
}
