import { EventBus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
const { ccclass, property } = cc._decorator;

/**
 * Handles showing the result popup when a game ends.
 * ResultLine falls from above the screen with bounce effect,
 * then RestartButton appears with bounce animation.
 */
@ccclass("")
export class PopupController extends cc.Component {
  /** ResultLine node that falls from above */
  @property(cc.Node)
  resultLine: cc.Node = null;

  /** Title label displaying Victory or Defeat text. */
  @property(cc.Label)
  lblTitle: cc.Label = null;

  /** Label showing the final score amount. */
  @property(cc.Label)
  lblFinalScore: cc.Label = null;

  /** Restart button node. */
  @property(cc.Button)
  btnRestart: cc.Button = null;

  /** Original position of ResultLine for animation */
  private originalResultLinePosition: cc.Vec3 = cc.Vec3.ZERO;

  /** Cached handlers so we can unsubscribe without removing others' listeners. */
  private onWin = (score: number): void => this.show(true, score);
  private onLose = (score: number): void => this.show(false, score);

  onLoad(): void {
    // Save the original position of ResultLine
    if (this.resultLine) {
      this.originalResultLinePosition = this.resultLine.position.clone();
      this.resultLine.active = false;
    }

    // Hide the RestartButton initially
    if (this.btnRestart) {
      this.btnRestart.node.active = false;
    }
  }

  onEnable(): void {
    EventBus.on(EventNames.GameWon, this.onWin);
    EventBus.on(EventNames.GameLost, this.onLose);
  }

  onDisable(): void {
    EventBus.off(EventNames.GameWon, this.onWin);
    EventBus.off(EventNames.GameLost, this.onLose);
  }

  /**
   * Populates UI fields and plays falling animation for ResultLine,
   * then shows RestartButton with bounce effect.
   * @param win Whether the game was won
   * @param score Final player score
   */
  show(win: boolean, score: number): void {
    if (this.lblTitle) {
      this.lblTitle.string = win ? "Победа!" : "Поражение...";
      this.lblTitle.node.color = win ? cc.Color.YELLOW : cc.Color.RED;
    }

    if (this.lblFinalScore) {
      this.lblFinalScore.string = String(score);
    }

    // Hide the RestartButton before the animation
    if (this.btnRestart) {
      this.btnRestart.node.active = false;
    }

    // Start the animation of the ResultLine falling
    this.animateResultLineFall();
  }

  private animateResultLineFall(): void {
    if (!this.resultLine) return;

    // Set the ResultLine above the screen
    const startPosition = this.originalResultLinePosition.clone();
    startPosition.y += 1000; // Above the screen
    this.resultLine.active = true;
    this.resultLine.setPosition(startPosition);

    // Анимация падения с инерцией
    cc.tween(this.resultLine)
      .to(
        0.8,
        { position: this.originalResultLinePosition },
        { easing: "backOut" },
      )
      .call(() => {
        // After falling, show the RestartButton
        this.showRestartButton();
      })
      .start();
  }

  private showRestartButton(): void {
    if (!this.btnRestart) return;

    // Show the button
    this.btnRestart.node.active = true;
    this.btnRestart.node.scale = 0;

    // Animation of appearance with bounce effect
    cc.tween(this.btnRestart.node)
      .to(0.4, { scale: 1 }, { easing: "backOut" })
      .start();

    // Configure the click handler
    this.btnRestart.node.once("click", () => {
      console.log("Restart");

      // Animate the hiding of elements
      this.hideElementsWithAnimation(() => {
        EventBus.emit(EventNames.GameRestart);
      });

      // cc.director.loadScene("MenuScene");
    });
  }

  private hideElementsWithAnimation(callback: () => void): void {
    // First, animate the hiding of the RestartButton
    if (this.btnRestart) {
      cc.tween(this.btnRestart.node)
        .to(0.3, { scale: 0 }, { easing: "backIn" })
        .call(() => {
          this.btnRestart.node.active = false;
        })
        .start();
    }

    // Then animate the ResultLine flying up
    if (this.resultLine) {
      const endPosition = this.originalResultLinePosition.clone();
      endPosition.y += 1000; // It flies up

      cc.tween(this.resultLine)
        .to(0.6, { position: endPosition }, { easing: "backIn" })
        .call(() => {
          this.resultLine.active = false;
          callback();
        })
        .start();
    }
  }
}
