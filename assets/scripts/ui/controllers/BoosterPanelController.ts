import { EventBus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import { boosterService } from "../../core/boosters/BoosterSetup";
import { BoosterRegistry } from "../../core/boosters/BoosterRegistry";
import SpriteHighlight from "../utils/SpriteHighlight";
import { boosterSelectionService } from "../services/BoosterSelectionService";

const { ccclass, property } = cc._decorator;

interface BoosterSlot {
  node: cc.Node;
  button: cc.Button | null;
  icon: cc.Sprite | null;
  counterLabel: cc.Label | null;
  highlight: SpriteHighlight | null;
  boosterId: string;
  charges: number;
  isActive: boolean;
}

/**
 * Controller for the booster panel.
 * Manages the display and interaction of booster slots.
 */
@ccclass()
export default class BoosterPanelController extends cc.Component {
  @property(cc.Node)
  boosterList: cc.Node = null;

  @property(cc.Prefab)
  boosterSlotPrefab: cc.Prefab = null;

  @property(cc.Node)
  boosterLabel: cc.Node = null;

  private boosterSlots: BoosterSlot[] = [];

  start(): void {
    this.setupEventListeners();
    const charges = boosterSelectionService.getConfirmedCharges();
    this.createSlots(charges);

    if (Object.keys(charges).length === 0) {
      this.boosterLabel.active = false;
    }
  }

  private createSlots(charges: Record<string, number>): void {
    if (!this.boosterList || !this.boosterSlotPrefab) {
      console.warn("Missing boosterList or boosterSlotPrefab");
      return;
    }

    // Clear existing slots
    this.boosterList.removeAllChildren();
    this.boosterSlots = [];

    const entries = Object.entries(charges).filter(([, c]) => c > 0);

    for (let i = 0; i < entries.length; i++) {
      const [boosterId, count] = entries[i];
      const node = cc.instantiate(this.boosterSlotPrefab);
      this.boosterList.addChild(node);
      node.setPosition(0, 0, 0);

      const button = node.getComponent(cc.Button);
      const counterLabel =
        node
          .getChildByName("BoosterCounter")
          ?.getChildByName("CounterLabel")
          ?.getComponent(cc.Label) || null;

      const def = BoosterRegistry.find((b) => b.id === boosterId);
      if (!def) return;

      const icon =
        node.getChildByName("BoosterIcon")?.getComponent(cc.Sprite) || null;
      if (icon) {
        cc.resources.load(def.icon, cc.SpriteFrame, (err, spriteFrame) => {
          if (!err && spriteFrame && icon) {
            icon.spriteFrame = spriteFrame as cc.SpriteFrame;
          }
        });
      }
      console.log("icon", icon);

      const slot: BoosterSlot = {
        node,
        button,
        icon,
        counterLabel,
        highlight: null,
        boosterId,
        charges: count,
        isActive: false,
      };

      this.addHighlightToSlot(slot);
      this.setupSlotClickHandler(slot);
      this.setBoosterIcon(slot, boosterId);

      if (slot.counterLabel) {
        slot.counterLabel.string = String(count);
      }

      slot.node.active = true;
      this.boosterSlots.push(slot);
    }

    // Force update the layout
    const layout = this.boosterList.getComponent(cc.Layout);
    if (layout) {
      layout.updateLayout();
    }
  }

  private setupEventListeners(): void {
    EventBus.on(EventNames.BoosterConsumed, this.onBoosterConsumed, this);
    EventBus.on(EventNames.BoosterCancelled, this.onBoosterCancelled, this);
    EventBus.on(EventNames.BoostersSelected, this.onBoostersSelected, this);
    EventBus.on(EventNames.GameRestart, this.onGameRestart, this);
  }

  private setBoosterIcon(slot: BoosterSlot, boosterId: string): void {
    if (!slot.icon) return;
    const def = BoosterRegistry.find((b) => b.id === boosterId);
    if (!def) return;
    cc.resources.load(def.icon, cc.SpriteFrame, (err, spriteFrame) => {
      if (!err && spriteFrame && slot.icon) {
        slot.icon.spriteFrame = spriteFrame as cc.SpriteFrame;
      }
    });
  }

  private addHighlightToSlot(slot: BoosterSlot): void {
    const highlight = slot.node.addComponent(SpriteHighlight);
    highlight.highlightColor = cc.Color.YELLOW;
    highlight.highlightOpacity = 200;
    slot.highlight = highlight;
  }

  private setupSlotClickHandler(slot: BoosterSlot): void {
    if (!slot.button) return;
    slot.button.node.off(cc.Node.EventType.TOUCH_END);
    slot.button.node.on(cc.Node.EventType.TOUCH_END, () => {
      this.handleSlotClick(slot);
    });
  }

  private handleSlotClick(clickedSlot: BoosterSlot): void {
    if (!clickedSlot.boosterId) return;
    if (clickedSlot.isActive) {
      this.clearActiveSlot();
      boosterService?.cancel();
      return;
    }
    this.setActiveSlot(clickedSlot);
  }

  private setActiveSlot(slot: BoosterSlot): void {
    this.clearActiveSlot();
    boosterService?.activate(slot.boosterId);
    slot.isActive = true;
    slot.highlight?.setHighlight();
    this.startPulse(slot.node);
  }

  private clearActiveSlot(): void {
    const activeSlot = this.boosterSlots.find((s) => s.isActive);
    if (activeSlot) {
      activeSlot.isActive = false;
      activeSlot.highlight?.clearHighlight();
      this.stopPulse(activeSlot.node);
    }
  }

  private startPulse(node: cc.Node): void {
    node.stopAllActions();
    const pulse = () => {
      cc.tween(node)
        .to(0.5, { scale: 1.1 })
        .to(0.5, { scale: 1 })
        .call(pulse)
        .start();
    };
    pulse();
  }

  private stopPulse(node: cc.Node): void {
    node.stopAllActions();
    node.scale = 1;
  }

  private onBoosterConsumed(boosterId: string): void {
    const slot = this.boosterSlots.find((s) => s.boosterId === boosterId);
    if (slot) {
      slot.charges = boosterService?.getCharges(boosterId) ?? 0;
      if (slot.counterLabel) {
        slot.counterLabel.string = String(slot.charges);
      }
      if (slot.charges <= 0) {
        this.hideBoosterSlot(slot);
      }
    }

    // Deactivate any active booster after it has been consumed
    this.clearActiveSlot();
  }

  private onBoosterCancelled(): void {
    this.clearActiveSlot();
  }

  private onBoostersSelected(charges: Record<string, number>): void {
    this.createSlots(charges);
  }

  private onGameRestart(): void {
    boosterService?.cancel();
    this.clearActiveSlot();
    this.createSlots({});
  }

  private hideBoosterSlot(slot: BoosterSlot): void {
    slot.node.active = false;
    slot.isActive = false;
    slot.highlight?.clearHighlight();
    this.stopPulse(slot.node);
  }

  onDestroy(): void {
    EventBus.off(EventNames.BoosterConsumed, this.onBoosterConsumed, this);
    EventBus.off(EventNames.BoosterCancelled, this.onBoosterCancelled, this);
    EventBus.off(EventNames.BoostersSelected, this.onBoostersSelected, this);
    EventBus.off(EventNames.GameRestart, this.onGameRestart, this);
  }
}
