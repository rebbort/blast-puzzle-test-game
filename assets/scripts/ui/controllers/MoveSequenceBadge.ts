const { ccclass, property } = cc._decorator;

import { MoveSequenceLogger } from "../../core/diagnostics/MoveSequenceLogger";

@ccclass()
export default class MoveSequenceBadge extends cc.Component {
  @property(cc.Label)
  label: cc.Label = null;

  private logger!: MoveSequenceLogger;

  onLoad(): void {
    if (!this.label) {
      this.label =
        this.getComponent(cc.Label) || this.node.addComponent(cc.Label);
    }
    this.logger = MoveSequenceLogger.current as MoveSequenceLogger;
    if (!this.logger) return;
    this.logger.onStatusChange((s) => {
      this.label.string = `Last move: ${s.step}`;
      this.label.node.color = s.unsynced ? cc.Color.RED : cc.Color.WHITE;
    });
    const l = this.logger.getStatus();
    this.label.string = `Last move: ${l.step}`;
  }
}
