import { EventBus } from "../core/EventBus";
import { EventNames } from "../core/events/EventNames";
const { ccclass } = cc._decorator;

interface NodeUtils {
  getChildByName(name: string): NodeUtils | null;
  getComponent(name: string): unknown;
  on(event: string, cb: () => void): void;
  node?: NodeUtils;
}

/**
 * Controls the pause popup displayed when the game is paused.
 * Emits GameResumed or reloads the scene depending on button presses.
 */
@ccclass("")
export class PopupPause extends cc.Component {
  private btnResume: NodeUtils | null = null;
  private btnRestart: NodeUtils | null = null;

  start(): void {
    const root = this.node as unknown as NodeUtils;
    this.btnResume = root
      .getChildByName("btnResume")
      ?.getComponent("Button") as NodeUtils | null;
    this.btnRestart = root
      .getChildByName("btnRestart")
      ?.getComponent("Button") as NodeUtils | null;

    this.btnResume?.node?.on("click", () => {
      EventBus.emit(EventNames.GameResumed);
    });
    this.btnRestart?.node?.on("click", () => {
      cc.director.loadScene("GameScene");
    });
  }
}
