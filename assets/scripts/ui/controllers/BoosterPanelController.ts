import { EventBus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import { boosterService } from "../../core/boosters/BoosterSetup";
import { BoosterRegistry } from "../../core/boosters/BoosterRegistry";
import SpriteHighlight from "../utils/SpriteHighlight";

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

@ccclass()
export default class BoosterPanelController extends cc.Component {
  @property(cc.Node)
  boosterList: cc.Node = null;

  private selectedBoosters: Record<string, number> = {};
  private boosterSlots: BoosterSlot[] = [];

  start(): void {
    this.initializeSlots();
    this.setupEventListeners();
  }

  private initializeSlots(): void {
    if (!this.boosterList) return;
    this.boosterSlots = [];
    this.boosterList.children.forEach((child: cc.Node) => {
      const button = child.getComponent(cc.Button);
      const icon =
        child.getChildByName("Icon")?.getComponent(cc.Sprite) || null;
      const counterLabel =
        child.getChildByName("CounterLabel")?.getComponent(cc.Label) || null;

      const slot: BoosterSlot = {
        node: child,
        button,
        icon,
        counterLabel,
        highlight: null,
        boosterId: "",
        charges: 0,
        isActive: false,
      };
      this.addHighlightToSlot(slot);
      this.setupSlotClickHandler(slot);

      // скрываем до получения выбранных бустеров
      slot.node.active = false;

      this.boosterSlots.push(slot);
    });
  }

  private setupEventListeners(): void {
    EventBus.on(EventNames.BoostersSelected, this.onBoostersSelected, this);
    EventBus.on(EventNames.BoosterConsumed, this.onBoosterConsumed, this);
    EventBus.on(EventNames.BoosterCancelled, this.onBoosterCancelled, this);
  }

  private onBoostersSelected(charges: Record<string, number>): void {
    this.selectedBoosters = charges;

    const entries = Object.entries(charges).filter(([, c]) => c > 0);

    this.boosterSlots.forEach((slot, index) => {
      const entry = entries[index];
      if (!entry) {
        slot.boosterId = "";
        slot.charges = 0;
        slot.node.active = false;
        return;
      }
      const [id, count] = entry as [string, number];
      slot.boosterId = id;
      slot.charges = count;
      this.setBoosterIcon(slot, id);
      if (slot.counterLabel) slot.counterLabel.string = String(count);
      slot.node.active = true;
    });
  }

  // Метод setupBoosterSlot больше не нужен - бустеры настраиваются при инициализации

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
    slot.isActive = true;
    slot.highlight?.setHighlight();
    this.startPulse(slot.node);
    boosterService?.activate(slot.boosterId);
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
  }

  private onBoosterCancelled(): void {
    this.clearActiveSlot();
  }

  private hideBoosterSlot(slot: BoosterSlot): void {
    slot.node.active = false;
    slot.isActive = false;
    slot.highlight?.clearHighlight();
    this.stopPulse(slot.node);
  }

  onDestroy(): void {
    EventBus.off(EventNames.BoostersSelected, this.onBoostersSelected, this);
    EventBus.off(EventNames.BoosterConsumed, this.onBoosterConsumed, this);
    EventBus.off(EventNames.BoosterCancelled, this.onBoosterCancelled, this);
  }
}
