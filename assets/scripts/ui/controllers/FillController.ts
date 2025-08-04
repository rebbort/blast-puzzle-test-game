const { ccclass, property } = cc._decorator;

import { EventBus as bus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import GameBoardController from "./GameBoardController";
import TileView from "../views/TileView";
import type { Board } from "../../core/board/Board";
import { runFallAnimation } from "../utils/FallAnimator";
import { computeTilePosition } from "../utils/PositionUtils";

@ccclass()
export default class FillController extends cc.Component {
  /** Base TileNode prefab for new tiles. */
  @property(cc.Prefab)
  tileNodePrefab: cc.Prefab = null;

  @property(cc.Node)
  tilesLayer: cc.Node = null;

  private board!: Board;
  private tileViews!: TileView[][];
  /** Slots that are being filled awaiting FillDone */
  private pending: cc.Vec2[] = [];

  onLoad(): void {
    const boardCtrl = this.getComponent(GameBoardController)!;
    this.board = boardCtrl.getBoard();
    this.tilesLayer = this.node.getChildByName("TilesLayer")!;
    this.tileViews = boardCtrl.tileViews;
    bus.on(EventNames.FillStarted, this.onFillStarted, this);
    bus.on(EventNames.FillDone, this.onFillDone, this);
  }

  onDestroy(): void {
    bus.off(EventNames.FillStarted, this.onFillStarted, this);
    bus.off(EventNames.FillDone, this.onFillDone, this);
  }

  /**
   * Spawns visual tiles for new board pieces created by FillCommand.
   * Core.FillCommand updates the model before emitting FillStarted so the
   * board already contains new tiles when this handler runs.
   */
  private onFillStarted(slots: cc.Vec2[]): void {
    this.tileViews = this.getComponent(GameBoardController)!.tileViews;
    this.pending = slots;

    const byCol: { [key: number]: cc.Vec2[] } = {};
    for (let i = 0; i < slots.length; i++) {
      const p = slots[i];
      if (!byCol[p.x]) byCol[p.x] = [];
      byCol[p.x].push(p);
    }

    const delayStep = 0.1;

    for (const colStr of Object.keys(byCol)) {
      const list = byCol[parseInt(colStr, 10)];
      list.sort((a, b) => b.y - a.y); // bottom first
      for (let index = 0; index < list.length; index++) {
        const p = list[index];
        const view = cc
          .instantiate(this.tileNodePrefab)
          .getComponent(TileView) as TileView;

        view.node.parent = this.tilesLayer;
        view.node.active = true;
        view.node.opacity = 255;

        const start = computeTilePosition(p.x, -1, this.board);
        view.node.setPosition(start);
        const end = computeTilePosition(p.x, p.y, this.board);
        runFallAnimation(view.node, end, index * delayStep);

        view.node.zIndex = this.board.rows - p.y - 1;
        this.tileViews[p.y][p.x] = view;
      }
    }
  }

  private onFillDone(): void {
    for (let i = 0; i < this.pending.length; i++) {
      const p = this.pending[i];
      const view = this.tileViews[p.y][p.x];
      if (view) {
        view.apply(this.board.tileAt(p)!);
      }
    }
    this.pending = [];
  }

  /**
   * Updates references after board regeneration.
   */
  public reset(board: Board, tileViews: TileView[][]): void {
    this.board = board;
    this.tileViews = tileViews;
    this.pending = [];
  }
}
