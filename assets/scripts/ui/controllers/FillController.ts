const { ccclass, property } = cc._decorator;

import { EventBus as bus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import GameBoardController from "./GameBoardController";
import TileView from "../views/TileView";
import type { Board } from "../../core/board/Board";
import { loadBoardConfig } from "../../config/ConfigLoader";

@ccclass("FillController")
export default class FillController extends cc.Component {
  @property(cc.Prefab)
  tilePrefab!: cc.Prefab;

  private board!: Board;
  private tilesLayer!: cc.Node;

  onLoad(): void {
    const boardCtrl = this.getComponent(GameBoardController)!;
    this.board = boardCtrl.getBoard();
    this.tilesLayer = this.node.getChildByName("TilesLayer")!;
    bus.on(EventNames.FillStarted, this.onFill, this);
  }

  /**
   * Spawns visual tiles for new board pieces created by FillCommand.
   * Core.FillCommand updates the model before emitting FillStarted so the
   * board already contains new tiles when this handler runs.
   */
  private onFill(slots: cc.Vec2[]): void {
    slots.forEach((p) => {
      const view = cc
        .instantiate(this.tilePrefab)
        .getComponent(TileView) as TileView;
      view.node.parent = this.tilesLayer;
      const start = this.computePos(p.x, -1);
      view.node.setPosition(start);
      const tileData = this.board.tileAt(p)!;
      view.apply(tileData);
      const end = this.computePos(p.x, p.y);
      const dur = Math.abs(start.y - end.y) / 1400;
      view.node.runAction(cc.moveTo(dur, end));
    });
  }

  /**
   * Computes tile position exactly like GameBoardController.
   */
  private computePos(col: number, row: number): cc.Vec2 {
    const cfg = loadBoardConfig();
    const x = (col - this.board.cols / 2) * cfg.tileWidth;
    const y =
      (this.board.rows / 2 - row) * cfg.tileHeight -
      GameBoardController.VERTICAL_OFFSET;
    return cc.v2(x, y);
  }
}
