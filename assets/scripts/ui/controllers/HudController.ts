import { EventBus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
const { ccclass, property } = cc._decorator;

interface NodeUtils {
  getChildByName(name: string): NodeUtils | null;
  getComponent(name: string): unknown;
  on(event: string, cb: () => void): void;
  off?(event: string, cb?: () => void): void;
  node?: NodeUtils & { color?: cc.Color; active?: boolean };
}

// Simple animation helpers built with cc.tween for runtime usage.

/**
 * Controls the Heads Up Display of the GameScene.
 * Responsible for updating score/move counters and
 * dispatching events when HUD buttons are pressed.
 */
@ccclass()
export class HudController extends cc.Component {
  @property(cc.Label)
  lblScore: cc.Label = null;
  @property(cc.Label)
  lblMoves: cc.Label = null;
  @property(cc.Label)
  lblState: cc.Label = null;

  private btnPause: NodeUtils | null = null;

  private turns: number = 0;
  private score: number = 0;
  private targetScore: number = 0;
  private pauseHandler = (): void => this.onPauseClick();

  onLoad(): void {
    // Update moves counter when a turn is consumed
    EventBus.on(EventNames.TurnUsed, this.onTurnUsed, this);

    // Update score display after a turn ends
    EventBus.on(EventNames.TurnEnded, this.onTurnEnded, this);

    // Initialize HUD with initial values
    EventBus.on(EventNames.TurnsInit, this.onTurnsInit, this);

    console.log("HudController onLoad");
  }

  /** Initializes component references and event listeners. */
  start(): void {
    const root = this.node as unknown as NodeUtils;

    // Fallback lookup of label references when not assigned in editor
    if (!this.lblState) {
      const n = root.getChildByName("lblState");
      this.lblState = n?.getComponent("Label") as unknown as cc.Label;
    }
    if (!this.lblScore) {
      const n = root.getChildByName("lblScore");
      this.lblScore = n?.getComponent("Label") as unknown as cc.Label;
    }
    if (!this.lblMoves) {
      const n = root.getChildByName("lblMoves");
      this.lblMoves = n?.getComponent("Label") as unknown as cc.Label;
    }

    this.btnPause = root
      .getChildByName("btnPause")
      ?.getComponent("Button") as NodeUtils | null;

    this.btnPause?.node?.on("click", this.pauseHandler);

    // Display current FSM state in the HUD
    EventBus.on(EventNames.StateChanged, this.onStateChanged, this);
  }

  private onTurnsInit(data: {
    turns: number;
    score: number;
    targetScore: number;
  }): void {
    this.turns = data.turns;
    this.score = data.score;
    this.targetScore = data.targetScore;

    if (this.lblScore)
      this.lblScore.string = `${this.score} / ${this.targetScore}`;
    if (this.lblMoves) this.lblMoves.string = String(this.turns);
  }

  /**
   * Handles turn used event - updates moves counter and shows shake animation.
   */
  private onTurnUsed(left: number): void {
    if (this.lblMoves) this.lblMoves.string = String(left);
    const moveNode = this.lblMoves?.node as unknown as cc.Node | undefined;
    if (left <= 3 && moveNode) {
      EventBus.emit(EventNames.AnimationStarted, "moves-shake");
      cc.tween(moveNode)
        .to(0.05, { position: new cc.Vec3(-5, 0, 0) })
        .to(0.05, { position: new cc.Vec3(5, 0, 0) })
        .to(0.05, { position: new cc.Vec3(0, 0, 0) })
        .start();
      setTimeout(
        () => EventBus.emit(EventNames.AnimationEnded, "moves-shake"),
        150,
      );
    }
  }

  /**
   * Handles turn ended event - animates score update.
   */
  private onTurnEnded({ score }: { score: number }): void {
    if (!this.lblScore) return;
    const startVal = parseInt(this.lblScore.string, 10) || 0;
    const data = { value: startVal };
    EventBus.emit(EventNames.AnimationStarted, "score-tween");
    // Tween over half a second using an ease-out curve for smooth feel
    cc.tween(data).to(0.5, { value: score }, { easing: "quadOut" }).start();
    const id = setInterval(() => {
      if (this.lblScore) {
        this.lblScore.string = `${Math.round(data.value)} / ${this.targetScore}`;
      }
    }, 16);
    setTimeout(() => {
      clearInterval(id);
      if (this.lblScore)
        this.lblScore.string = `${score} / ${this.targetScore}`;
      EventBus.emit(EventNames.AnimationEnded, "score-tween");
    }, 500);
  }

  /**
   * Handles pause button click.
   */
  private onPauseClick(): void {
    EventBus.emit(EventNames.GamePaused);
  }

  /**
   * Handles state change - updates state label.
   */
  private onStateChanged(state: string): void {
    if (this.lblState) this.lblState.string = state;
  }

  onDestroy(): void {
    EventBus.off(EventNames.TurnUsed, this.onTurnUsed, this);
    EventBus.off(EventNames.TurnEnded, this.onTurnEnded, this);
    EventBus.off(EventNames.TurnsInit, this.onTurnsInit, this);
    EventBus.off(EventNames.StateChanged, this.onStateChanged, this);
    this.btnPause?.node?.off("click", this.pauseHandler);
  }
}
