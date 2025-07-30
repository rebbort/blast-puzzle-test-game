import { _decorator, Component, director } from "cc";
import { EventBus } from "../core/EventBus";
const { ccclass } = _decorator;

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
@ccclass("GameSceneController")
export class GameSceneController extends Component {
  private popup: { node: { active: boolean } } | null = null;

  start(): void {
    const root = this.node as unknown as NodeUtils;
    this.popup = root
      .getChildByName("PopupPause")
      ?.getComponent("PopupPause") as unknown as {
      node: { active: boolean };
    } | null;
    if (this.popup?.node) this.popup.node.active = false;

    EventBus.on("GamePaused", () => {
      director.pause();
      if (this.popup?.node) this.popup.node.active = true;
    });

    EventBus.on("GameResumed", () => {
      director.resume();
      if (this.popup?.node) this.popup.node.active = false;
    });
  }
}
