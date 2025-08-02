import { EventBus } from "../core/EventBus";
import { EventNames } from "../core/events/EventNames";
import { boosterService } from "../core/boosters/BoosterSetup";
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
@ccclass("")
export class HudController extends cc.Component {
  @property(cc.Label)
  lblScore!: cc.Label;
  @property(cc.Label)
  lblMoves!: cc.Label;
  @property(cc.Label)
  lblState!: cc.Label;

  private slots: {
    id: string;
    btn: NodeUtils | null;
    label: cc.Label | null;
  }[] = [];
  private btnPause: NodeUtils | null = null;

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
    if (panel) {
      for (let i = 0; i < 2; i++) {
        const btn = panel
          .getChildByName(`Slot${i}`)
          ?.getComponent("Button") as NodeUtils | null;
        const label = btn?.node
          ?.getChildByName("CounterLabel")
          ?.getComponent("Label") as cc.Label | null;
        this.slots.push({ id: "", btn, label });
      }
    }

    this.btnPause = root
      .getChildByName("btnPause")
      ?.getComponent("Button") as NodeUtils | null;

    this.btnPause?.node?.on("click", this.onPauseClick.bind(this));

    EventBus.on(EventNames.BoostersSelected, this.onBoostersSelected, this);
    EventBus.on(EventNames.BoosterActivated, this.onBoosterActivated, this);
    EventBus.on(EventNames.BoosterConsumed, this.onBoosterConsumed, this);
    EventBus.on(EventNames.BoosterCancelled, this.onBoosterCancelled, this);

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
   * Populates booster slots once the player selects boosters.
   */
  private onBoostersSelected(charges: Record<string, number>): void {
    const entries = Object.entries(charges).filter(([, c]) => c > 0);
    this.slots.forEach((slot, i) => {
      const entry = entries[i];
      if (!entry || !slot.btn?.node) {
        if (slot.btn?.node) slot.btn.node.active = false;
        slot.id = "";
        return;
      }
      const [id, count] = entry as [string, number];
      slot.id = id;
      if (slot.label) slot.label.string = String(count);
      slot.btn.node.active = true;
      slot.btn.node.off?.("click");
      slot.btn.node.on("click", () => boosterService?.activate(id));
    });
  }

  /**
   * Handles booster activation - shows pulse animation.
   */
  private onBoosterActivated(name: string): void {
    this.clearHighlight();
    const slot = this.slots.find((s) => s.id === name);
    if (slot?.btn?.node) {
      const node = slot.btn.node as unknown as cc.Node;
      node.color = cc.Color.YELLOW;
      this.activeBtn = slot.btn;
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
    const slot = this.slots.find((s) => s.id === id);
    if (slot?.label)
      slot.label.string = String(boosterService?.getCharges(id) ?? 0);
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

  /**
   * Handles state change - updates state label.
   */
  private onStateChanged(state: string): void {
    if (this.lblState) this.lblState.string = state;
  }
}
