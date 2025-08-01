const { ccclass, property } = cc._decorator;

import { EventBus as bus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import GameBoardController from "./GameBoardController";
import TileView from "../views/TileView";
import type { Board } from "../../core/board/Board";
import { loadBoardConfig } from "../../config/ConfigLoader";

@ccclass("FillController")
export default class FillController extends cc.Component {
  /** Базовый префаб TileNode для новых тайлов. */
  @property(cc.Prefab)
  tileNodePrefab!: cc.Prefab;

  private board!: Board;
  private tilesLayer!: cc.Node;
  private tileViews!: TileView[][];

  onLoad(): void {
    const boardCtrl = this.getComponent(GameBoardController)!;
    this.board = boardCtrl.getBoard();
    this.tilesLayer = this.node.getChildByName("TilesLayer")!;
    this.tileViews = boardCtrl.tileViews;
    // core triggers FillStarted before generating new tiles so UI can
    // prepare animations. We mostly care about FillDone which carries
    // final tile data, but subscribe to both for completeness.
    bus.on(EventNames.FillStarted, () => {}, this);
    bus.on(EventNames.FillDone, this.onFillDone, this);
  }

  /**
   * Spawns visual tiles for new board pieces created by FillCommand.
   * Core.FillCommand updates the model before emitting FillStarted so the
   * board already contains new tiles when this handler runs.
   */
  private onFillDone(newTiles: { pos: cc.Vec2; tile: unknown }[]): void {
    // Keep matrix reference fresh in case MoveFlowController rebuilt it
    this.tileViews = this.getComponent(GameBoardController)!.tileViews;
    newTiles.forEach(({ pos, tile }) => {
      const view = cc
        .instantiate(this.tileNodePrefab)
        .getComponent(TileView) as TileView;
      view.node.parent = this.tilesLayer;
      // Start slightly above the board so the tile visually falls in
      const start = this.computePos(pos.x, -1);
      view.node.setPosition(start);
      const end = this.computePos(pos.x, pos.y);
      const dur = Math.abs(start.y - end.y) / 1400;
      view.node.runAction(
        cc.sequence(
          cc.moveTo(dur, end),
          cc.callFunc(() => bus.emit("TileFilledAnimationDone", pos)),
        ),
      );
      view.apply(tile as TileView["tile"]);
      this.tileViews[pos.y][pos.x] = view;
    });
  }

  /**
   * Computes tile position exactly like GameBoardController.
   */
  private computePos(col: number, row: number): cc.Vec2 {
    const cfg = loadBoardConfig();
    // Board coordinates start at top-left while Cocos origin is in the
    // centre. Reuse the same math as GameBoardController so visuals and
    // model stay aligned.
    const x = (col - this.board.cols / 2) * cfg.tileWidth;
    const y =
      (this.board.rows / 2 - row) * cfg.tileHeight -
      GameBoardController.VERTICAL_OFFSET;
    return cc.v2(x, y);
  }
}
