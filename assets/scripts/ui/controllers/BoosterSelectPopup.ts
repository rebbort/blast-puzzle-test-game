import BoosterSelectAnimationController from "./BoosterSelectAnimationController";
import { BoosterRegistry } from "../../core/boosters/BoosterRegistry";
import { boosterSelectionService } from "../services/BoosterSelectionService";
import SpriteHighlight from "../utils/SpriteHighlight";

const { ccclass, property } = cc._decorator;

interface BoosterSlot {
  node: cc.Node;
  boosterId: string;
  highlight: SpriteHighlight;
  icon: cc.Sprite | null;
}

/**
 * Popup UI that lets the player choose up to two boosters before entering the
 * game. Slots are instantiated from prefab and highlight when selected.
 */
@ccclass()
export default class BoosterSelectPopup extends cc.Component {
  @property(cc.Node)
  boosterSlotGrid: cc.Node = null;

  @property(cc.Prefab)
  boosterSlotPrefab: cc.Prefab = null;

  private slots: BoosterSlot[] = [];
  private animationController: BoosterSelectAnimationController = null;

  onLoad(): void {
    this.animationController = this.getComponent(
      BoosterSelectAnimationController,
    );
    boosterSelectionService.reset();
    this.createSlots();
  }

  start(): void {
    const playButton = this.node.getChildByName("PlayButton");
    playButton?.on(cc.Node.EventType.TOUCH_END, () => this.startGame());
    this.animationController?.replayAnimation();
  }

  private createSlots(): void {
    if (!this.boosterSlotGrid || !this.boosterSlotPrefab) return;
    this.slots = [];

    BoosterRegistry.forEach((def) => {
      const node = cc.instantiate(this.boosterSlotPrefab);
      this.boosterSlotGrid.addChild(node);

      const icon = node.getChildByName("Icon")?.getComponent(cc.Sprite) || null;
      if (icon) {
        cc.resources.load(def.icon, cc.SpriteFrame, (err, spriteFrame) => {
          if (!err && spriteFrame && icon) {
            icon.spriteFrame = spriteFrame as cc.SpriteFrame;
          }
        });
      }

      const highlight = node.addComponent(SpriteHighlight);
      highlight.highlightColor = cc.Color.YELLOW;
      highlight.highlightOpacity = 200;

      const slot: BoosterSlot = {
        node,
        boosterId: def.id,
        highlight,
        icon,
      };

      node.on(cc.Node.EventType.TOUCH_END, () => this.onSlotClick(slot));
      this.slots.push(slot);
    });

    if (this.animationController) {
      this.animationController.boosterSlots = this.slots.map((s) => s.node);
    }
  }

  private onSlotClick(slot: BoosterSlot): void {
    boosterSelectionService.toggle(slot.boosterId);
    this.updateHighlights();
  }

  private updateHighlights(): void {
    const selected = new Set(boosterSelectionService.getSelected());
    this.slots.forEach((s) => {
      if (selected.has(s.boosterId)) {
        s.highlight.setHighlight();
      } else {
        s.highlight.clearHighlight();
      }
    });
  }

  private confirm(): void {
    boosterSelectionService.confirm();
    (this.node as unknown as { active: boolean }).active = false;
  }

  private startGame(): void {
    this.confirm();
  }

  public replayAnimation(): void {
    if (this.animationController) {
      this.animationController.replayAnimation();
    }
  }

  public showImmediately(): void {
    if (this.animationController) {
      this.animationController.showAllImmediately();
    }
  }
}
