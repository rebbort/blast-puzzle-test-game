import { EventBus } from "../core/EventBus";
import { EventNames } from "../core/events/EventNames";
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
  resultLine!: cc.Node;

  /** Title label displaying Victory or Defeat text. */
  @property(cc.Label)
  lblTitle!: cc.Label;

  /** Label showing the final score amount. */
  @property(cc.Label)
  lblFinalScore!: cc.Label;

  /** Restart button node. */
  @property(cc.Button)
  btnRestart!: cc.Button;

  /** Original position of ResultLine for animation */
  private originalResultLinePosition: cc.Vec3 = cc.Vec3.ZERO;

  onLoad(): void {
    // Сохраняем оригинальную позицию ResultLine
    if (this.resultLine) {
      this.originalResultLinePosition = this.resultLine.position.clone();
      this.resultLine.active = false;
    }

    // Скрываем RestartButton изначально
    if (this.btnRestart) {
      this.btnRestart.node.active = false;
    }
  }

  onEnable(): void {
    EventBus.on(EventNames.GameWon, (score: number) => this.show(true, score));
    EventBus.on(EventNames.GameLost, (score: number) =>
      this.show(false, score),
    );
  }

  onDisable(): void {
    EventBus.off(EventNames.GameWon);
    EventBus.off(EventNames.GameLost);
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

    // Скрываем RestartButton перед анимацией
    if (this.btnRestart) {
      this.btnRestart.node.active = false;
    }

    // Начинаем анимацию падения ResultLine
    this.animateResultLineFall();
  }

  private animateResultLineFall(): void {
    if (!this.resultLine) return;

    // Устанавливаем ResultLine над экраном
    const startPosition = this.originalResultLinePosition.clone();
    startPosition.y += 1000; // Над экраном
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
        // После падения показываем RestartButton
        this.showRestartButton();
      })
      .start();
  }

  private showRestartButton(): void {
    if (!this.btnRestart) return;

    // Показываем кнопку
    this.btnRestart.node.active = true;
    this.btnRestart.node.scale = 0;

    // Анимация появления с баунс эффектом
    cc.tween(this.btnRestart.node)
      .to(0.4, { scale: 1 }, { easing: "backOut" })
      .start();

    // Настраиваем обработчик клика
    this.btnRestart.node.once("click", () => {
      console.log("Restart");

      // Анимируем скрытие элементов
      this.hideElementsWithAnimation(() => {
        EventBus.emit(EventNames.GameRestart);
      });

      // cc.director.loadScene("MenuScene");
    });
  }

  private hideElementsWithAnimation(callback: () => void): void {
    // Сначала анимируем скрытие RestartButton
    if (this.btnRestart) {
      cc.tween(this.btnRestart.node)
        .to(0.3, { scale: 0 }, { easing: "backIn" })
        .call(() => {
          this.btnRestart.node.active = false;
        })
        .start();
    }

    // Затем анимируем улетание ResultLine вверх
    if (this.resultLine) {
      const endPosition = this.originalResultLinePosition.clone();
      endPosition.y += 1000; // Улетает вверх

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
