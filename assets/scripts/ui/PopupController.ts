import { _decorator, Component, director, tween, Vec3 } from "cc";
import { EventBus } from "../core/EventBus";
const { ccclass } = _decorator;

/**
 * Handles showing the result popup when a game ends.
 * The background uses a 9-sliced sprite with 16px borders so it
 * can scale smoothly without stretching the corners.
 */
@ccclass("PopupController")
export class PopupController extends Component {
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
      this.btnRestart.node.once("click", () => director.loadScene("MenuScene"));

    (this.node as unknown as { scale: Vec3 }).scale = new Vec3(0, 0, 0);
    tween(this.node as unknown as { scale: Vec3 })
      .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: "backOut" })
      .start();
  }
}
