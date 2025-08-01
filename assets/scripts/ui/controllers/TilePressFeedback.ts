const { ccclass } = cc._decorator;

import { EventBus as bus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import GameBoardController from "./GameBoardController";

@ccclass("TilePressFeedback")
export default class TilePressFeedback extends cc.Component {
  private boardCtrl!: GameBoardController;

  onLoad(): void {
    this.boardCtrl = this.getComponent(GameBoardController)!;
    bus.on(EventNames.TilePressed, this.onTilePressed, this);
  }

  private onTilePressed(pos: cc.Vec2): void {
    const view = this.boardCtrl.tileViews[pos.y]?.[pos.x];
    view?.pressFeedback();
  }
}
