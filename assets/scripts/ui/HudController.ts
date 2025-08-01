import { EventBus } from "../core/EventBus";
import { EventNames } from "../core/events/EventNames";
const { ccclass, property } = cc._decorator;

interface NodeUtils {
  getChildByName(name: string): NodeUtils | null;
  getComponent(name: string): unknown;
  on(event: string, cb: () => void): void;
  runAction?(action: unknown): void;
  node?: NodeUtils;
}

// Helper creators for simple actions used with runAction. Defined as functions
// to avoid accessing the `cc` global during tests where action APIs are not
// stubbed.
function createShake(): cc.ActionInterval {
  return cc.repeat(
    cc.sequence(cc.moveBy(0.05, 5, 0), cc.moveBy(0.05, -5, 0)),
    2,
  );
}

function createPulse(): cc.ActionInterval {
  return cc.sequence(cc.scaleTo(0.1, 1.2), cc.scaleTo(0.1, 1));
}

/**
 * Controls the Heads Up Display of the GameScene.
 * Responsible for updating score/move counters and
 * dispatching events when HUD buttons are pressed.
 */
@ccclass("")
export class HudController extends cc.Component {
  @property(cc.Label)
  lblScore!: cc.Label;
  @property(cc.Label)
  lblMoves!: cc.Label;
  @property(cc.Label)
  lblState!: cc.Label;

  private btnBomb: NodeUtils | null = null;
  private btnSwap: NodeUtils | null = null;
  private btnPause: NodeUtils | null = null;

  private turns: number = 0;
  private score: number = 0;
  private targetScore: number = 0;

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

    const panel = root.getChildByName("BoosterPanel") as NodeUtils | null;
    this.btnBomb = panel
      ?.getChildByName("btnBomb")
      ?.getComponent("Button") as NodeUtils | null;
    this.btnSwap = panel
      ?.getChildByName("btnSwap")
      ?.getComponent("Button") as NodeUtils | null;

    this.btnPause = root
      .getChildByName("btnPause")
      ?.getComponent("Button") as NodeUtils | null;

    // Booster and pause button interactions
    this.btnBomb?.node?.on("click", this.onBombClick.bind(this));
    this.btnSwap?.node?.on("click", this.onSwapClick.bind(this));
    this.btnPause?.node?.on("click", this.onPauseClick.bind(this));

    EventBus.on(EventNames.BoosterActivated, this.onBoosterActivated, this);

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
    const moveNode = this.lblMoves?.node as NodeUtils | undefined;
    if (left <= 3 && moveNode?.runAction) {
      EventBus.emit(EventNames.AnimationStarted, "moves-shake");
      moveNode.runAction(createShake());
      EventBus.emit(EventNames.AnimationEnded, "moves-shake");
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
   * Handles bomb booster button click.
   */
  private onBombClick(): void {
    EventBus.emit(EventNames.BoosterActivated, "bomb");
  }

  /**
   * Handles swap booster button click.
   */
  private onSwapClick(): void {
    EventBus.emit(EventNames.BoosterActivated, "swap");
  }

  /**
   * Handles pause button click.
   */
  private onPauseClick(): void {
    EventBus.emit(EventNames.GamePaused);
  }

  /**
   * Handles booster activation - shows pulse animation.
   */
  private onBoosterActivated(name: string): void {
    const btn =
      name === "bomb" ? this.btnBomb : name === "swap" ? this.btnSwap : null;
    if (btn?.node?.runAction) {
      EventBus.emit(EventNames.AnimationStarted, "booster-pulse");
      btn.node.runAction(createPulse());
      EventBus.emit(EventNames.AnimationEnded, "booster-pulse");
    }
  }

  /**
   * Handles state change - updates state label.
   */
  private onStateChanged(state: string): void {
    if (this.lblState) this.lblState.string = state;
  }
}
