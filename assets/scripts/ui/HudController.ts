import { EventBus } from "../core/EventBus";
import { EventNames } from "../core/events/EventNames";
import { boosterService } from "../core/boosters/BoosterSetup";
const { ccclass, property } = cc._decorator;

interface NodeUtils {
  getChildByName(name: string): NodeUtils | null;
  getComponent(name: string): unknown;
  on(event: string, cb: () => void): void;
  node?: NodeUtils;
}

// Simple animation helpers built with cc.tween for runtime usage.

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
  private btnSuperRow: NodeUtils | null = null;
  private btnSuperCol: NodeUtils | null = null;
  private btnPause: NodeUtils | null = null;

  private lblBombCharges: cc.Label | null = null;
  private lblRowCharges: cc.Label | null = null;
  private lblColCharges: cc.Label | null = null;

  private activeBtn: NodeUtils | null = null;

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
    this.btnSuperRow = panel
      ?.getChildByName("btnSuperRow")
      ?.getComponent("Button") as NodeUtils | null;
    this.btnSuperCol = panel
      ?.getChildByName("btnSuperCol")
      ?.getComponent("Button") as NodeUtils | null;
    this.btnSwap = panel
      ?.getChildByName("btnSwap")
      ?.getComponent("Button") as NodeUtils | null;

    this.btnPause = root
      .getChildByName("btnPause")
      ?.getComponent("Button") as NodeUtils | null;

    // Booster and pause button interactions
    this.btnBomb?.node?.on("click", this.onBombClick.bind(this));
    this.btnSuperRow?.node?.on("click", this.onSuperRowClick.bind(this));
    this.btnSuperCol?.node?.on("click", this.onSuperColClick.bind(this));
    this.btnSwap?.node?.on("click", this.onSwapClick.bind(this));
    this.btnPause?.node?.on("click", this.onPauseClick.bind(this));

    EventBus.on(EventNames.BoosterActivated, this.onBoosterActivated, this);
    EventBus.on(EventNames.BoosterConsumed, this.onBoosterConsumed, this);
    EventBus.on(EventNames.BoosterCancelled, this.onBoosterCancelled, this);

    // Display current FSM state in the HUD
    EventBus.on(EventNames.StateChanged, this.onStateChanged, this);

    // preload charge labels
    this.lblBombCharges = this.btnBomb?.node
      ?.getChildByName("lblCharges")
      ?.getComponent("Label") as cc.Label | null;
    this.lblRowCharges = this.btnSuperRow?.node
      ?.getChildByName("lblCharges")
      ?.getComponent("Label") as cc.Label | null;
    this.lblColCharges = this.btnSuperCol?.node
      ?.getChildByName("lblCharges")
      ?.getComponent("Label") as cc.Label | null;

    this.updateCharges("bomb");
    this.updateCharges("superRow");
    this.updateCharges("superCol");
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
   * Handles bomb booster button click.
   */
  private onBombClick(): void {
    boosterService?.activate("bomb");
  }

  private onSuperRowClick(): void {
    boosterService?.activate("superRow");
  }

  private onSuperColClick(): void {
    boosterService?.activate("superCol");
  }

  /**
   * Handles swap booster button click.
   */
  private onSwapClick(): void {
    boosterService?.activate("swap");
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
    this.clearHighlight();
    const btn = this.getButtonById(name);
    if (btn?.node) {
      const node = btn.node as unknown as cc.Node;
      node.color = cc.Color.YELLOW;
      this.activeBtn = btn;
      EventBus.emit(EventNames.AnimationStarted, "booster-pulse");
      cc.tween(node)
        .to(0.1, { scale: new cc.Vec3(1.2, 1.2, 1) })
        .to(0.1, { scale: new cc.Vec3(1, 1, 1) })
        .start();
      setTimeout(
        () => EventBus.emit(EventNames.AnimationEnded, "booster-pulse"),
        200,
      );
    }
  }

  private onBoosterConsumed(id: string): void {
    this.updateCharges(id);
    this.clearHighlight();
  }

  private onBoosterCancelled(): void {
    this.clearHighlight();
  }

  private clearHighlight(): void {
    if (this.activeBtn?.node) {
      const node = this.activeBtn.node as unknown as cc.Node;
      node.color = cc.Color.WHITE;
    }
    this.activeBtn = null;
  }

  private getButtonById(id: string): NodeUtils | null {
    switch (id) {
      case "bomb":
        return this.btnBomb;
      case "superRow":
        return this.btnSuperRow;
      case "superCol":
        return this.btnSuperCol;
      case "swap":
        return this.btnSwap;
      default:
        return null;
    }
  }

  private updateCharges(id: string): void {
    const label =
      id === "bomb"
        ? this.lblBombCharges
        : id === "superRow"
          ? this.lblRowCharges
          : id === "superCol"
            ? this.lblColCharges
            : null;
    if (label) label.string = String(boosterService?.getCharges(id) ?? 0);
  }

  /**
   * Handles state change - updates state label.
   */
  private onStateChanged(state: string): void {
    if (this.lblState) this.lblState.string = state;
  }
}
