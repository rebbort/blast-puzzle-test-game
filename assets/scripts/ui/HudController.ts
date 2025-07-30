import { EventBus } from "../core/EventBus";
const { ccclass } = cc._decorator;

interface NodeUtils {
  getChildByName(name: string): NodeUtils | null;
  getComponent(name: string): unknown;
  on(event: string, cb: () => void): void;
  runAction?(action: unknown): void;
  node?: NodeUtils;
}

// Placeholder animations used with runAction. In the real game these would be
// cc.Action objects describing the shake/pulse behaviour.
const shake = {};
const pulse = {};

/**
 * Controls the Heads Up Display of the GameScene.
 * Responsible for updating score/move counters and
 * dispatching events when HUD buttons are pressed.
 */
@ccclass("HudController")
export class HudController extends cc.Component {
  private lblScore: cc.Label | null = null;
  private lblMoves: cc.Label | null = null;
  private btnBomb: NodeUtils | null = null;
  private btnSwap: NodeUtils | null = null;
  private btnPause: NodeUtils | null = null;

  /** Initializes component references and event listeners. */
  start(): void {
    const root = this.node as unknown as NodeUtils;

    this.lblScore = root
      .getChildByName("lblScore")
      ?.getComponent("Label") as cc.Label | null;
    this.lblMoves = root
      .getChildByName("lblMoves")
      ?.getComponent("Label") as cc.Label | null;

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

    // Update moves counter when a turn is consumed
    EventBus.on("TurnUsed", (left: number) => {
      if (this.lblMoves) this.lblMoves.string = String(left);
      const moveNode = this.lblMoves?.node as unknown as NodeUtils | undefined;
      if (left <= 3 && moveNode?.runAction) {
        EventBus.emit("AnimationStarted", "moves-shake");
        moveNode.runAction(shake);
        EventBus.emit("AnimationEnded", "moves-shake");
      }
    });

    // Update score display after a turn ends
    EventBus.on("TurnEnded", ({ score }: { score: number }) => {
      if (!this.lblScore) return;
      const startVal = parseInt(this.lblScore.string, 10) || 0;
      const data = { value: startVal };
      EventBus.emit("AnimationStarted", "score-tween");
      // Tween over half a second using an ease-out curve for smooth feel
      cc.tween(data).to(0.5, { value: score }, { easing: "quadOut" }).start();
      const id = setInterval(() => {
        if (this.lblScore)
          this.lblScore.string = String(Math.round(data.value));
      }, 16);
      setTimeout(() => {
        clearInterval(id);
        if (this.lblScore) this.lblScore.string = String(score);
        EventBus.emit("AnimationEnded", "score-tween");
      }, 500);
    });

    // Booster and pause button interactions
    this.btnBomb?.node?.on("click", () => {
      EventBus.emit("BoosterActivated", "bomb");
    });
    this.btnSwap?.node?.on("click", () => {
      EventBus.emit("BoosterActivated", "swap");
    });
    this.btnPause?.node?.on("click", () => {
      EventBus.emit("GamePaused");
    });

    EventBus.on("BoosterActivated", (name: string) => {
      const btn =
        name === "bomb" ? this.btnBomb : name === "swap" ? this.btnSwap : null;
      if (btn?.node?.runAction) {
        EventBus.emit("AnimationStarted", "booster-pulse");
        btn.node.runAction(pulse);
        EventBus.emit("AnimationEnded", "booster-pulse");
      }
    });
  }
}
