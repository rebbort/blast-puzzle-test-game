import { EventBus } from "../core/EventBus";
const { ccclass } = cc._decorator;

/**
 * Handles showing the result popup when a game ends.
 * The background uses a 9-sliced sprite with 16px borders so it
 * can scale smoothly without stretching the corners.
 */
@ccclass("PopupController")
export class PopupController extends cc.Component {
  /** Title label displaying Victory or Defeat text. */
  lblTitle!: { string: string };
  /** Label showing the final score amount. */
  lblFinalScore!: { string: string };
  /** Restart button node. */
  btnRestart!: { node: { once: (event: string, cb: () => void) => void } };

  onEnable(): void {
    EventBus.on("GameWon", (score: number) => this.show(true, score));
    EventBus.on("GameLost", (score: number) => this.show(false, score));
  }

  onDisable(): void {
    EventBus.removeAllListeners("GameWon");
    EventBus.removeAllListeners("GameLost");
  }

  /**
   * Populates UI fields and plays a scale animation.
   * @param win Whether the game was won
   * @param score Final player score
   */
  show(win: boolean, score: number): void {
    if (this.lblTitle) this.lblTitle.string = win ? "Victory!" : "Defeat...";
    if (this.lblFinalScore) this.lblFinalScore.string = `Score: ${score}`;
    if (this.btnRestart)
      this.btnRestart.node.once("click", () =>
        cc.director.loadScene("MenuScene"),
      );

    (this.node as unknown as { scale: cc.Vec3 }).scale = new cc.Vec3(0, 0, 0);
    cc.tween(this.node as unknown as { scale: cc.Vec3 })
      .to(0.3, { scale: new cc.Vec3(1, 1, 1) }, { easing: "backOut" })
      .start();
  }
}
