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
    boosterSelectionService.confirm();
    this.createSlots();
  }

  start(): void {
    const playButton = this.node.getChildByName("PlayButton");
    playButton?.on(cc.Node.EventType.TOUCH_END, () => this.startGame());
    this.animationController?.replayAnimation();
  }

  private createSlots(): void {
    if (!this.boosterSlotGrid || !this.boosterSlotPrefab) {
      console.warn("Missing boosterSlotGrid or boosterSlotPrefab");
      return;
    }
    this.slots = [];

    for (let i = 0; i < BoosterRegistry.length; i++) {
      const def = BoosterRegistry[i];
      const node = cc.instantiate(this.boosterSlotPrefab);
      this.boosterSlotGrid.addChild(node);

      // Устанавливаем позицию для отладки
      node.setPosition(0, 0, 0);

      const icon =
        node.getChildByName("BoosterIcon")?.getComponent(cc.Sprite) || null;
      if (icon) {
        cc.resources.load(def.icon, cc.SpriteFrame, (err, spriteFrame) => {
          if (!err && spriteFrame && icon) {
            icon.spriteFrame = spriteFrame as cc.SpriteFrame;
          }
        });
      }

      const highlightedNode = node.getChildByName("BoosterSlotBg");
      const highlight = highlightedNode.addComponent(SpriteHighlight);
      highlight.highlightColor = cc.Color.YELLOW;
      highlight.highlightOpacity = 200;

      const slot: BoosterSlot = {
        node,
        boosterId: def.id,
        highlight,
        icon: null,
      };

      node.on(cc.Node.EventType.TOUCH_END, () => this.onSlotClick(slot));

      node.active = true;

      this.slots.push(slot);
    }

    // Принудительно обновляем Layout
    const layout = this.boosterSlotGrid.getComponent(cc.Layout);
    if (layout) {
      layout.updateLayout();
    }

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
