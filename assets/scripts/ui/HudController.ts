import { _decorator, Component, Label } from "cc";
import { EventBus } from "../core/EventBus";
const { ccclass } = _decorator;

interface NodeUtils {
  getChildByName(name: string): NodeUtils | null;
  getComponent(name: string): unknown;
  on(event: string, cb: () => void): void;
  node?: NodeUtils;
}

/**
 * Controls the Heads Up Display of the GameScene.
 * Responsible for updating score/move counters and
 * dispatching events when HUD buttons are pressed.
 */
@ccclass("HudController")
export class HudController extends Component {
  private lblScore: Label | null = null;
  private lblMoves: Label | null = null;
  private btnBomb: NodeUtils | null = null;
  private btnSwap: NodeUtils | null = null;
  private btnPause: NodeUtils | null = null;

  /** Initializes component references and event listeners. */
  start(): void {
    const root = this.node as unknown as NodeUtils;

    this.lblScore = root
      .getChildByName("lblScore")
      ?.getComponent("Label") as Label | null;
    this.lblMoves = root
      .getChildByName("lblMoves")
      ?.getComponent("Label") as Label | null;

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
    });

    // Update score display after a turn ends
    EventBus.on("TurnEnded", ({ score }: { score: number }) => {
      if (this.lblScore) this.lblScore.string = String(score);
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
  }
}
