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

  @property(cc.Node)
  tilesLayer!: cc.Node;

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

  /**
   * Spawns visual tiles for new board pieces created by FillCommand.
   * Core.FillCommand updates the model before emitting FillStarted so the
   * board already contains new tiles when this handler runs.
   */
  private onFillStarted(slots: cc.Vec2[]): void {
    this.tileViews = this.getComponent(GameBoardController)!.tileViews;
    this.pending = slots;

    console.log("FillController: tilesLayer exists?", !!this.tilesLayer);
    console.log(
      "FillController: tileNodePrefab exists?",
      !!this.tileNodePrefab,
    );

    const byCol: { [key: number]: cc.Vec2[] } = {};
    for (let i = 0; i < slots.length; i++) {
      const p = slots[i];
      if (!byCol[p.x]) byCol[p.x] = [];
      byCol[p.x].push(p);
    }

    const delayStep = 0.05;

    Object.keys(byCol).forEach((colStr) => {
      const col = parseInt(colStr, 10);
      const list = byCol[col];
      list.sort((a, b) => b.y - a.y); // bottom first
      for (let index = 0; index < list.length; index++) {
        const p = list[index];
        const view = cc
          .instantiate(this.tileNodePrefab)
          .getComponent(TileView) as TileView;

        console.log(
          "FillController: Created view for position",
          p,
          "view:",
          view,
        );

        view.node.parent = this.tilesLayer;
        view.node.active = true;
        console.log(
          "FillController: Set parent, node active:",
          view.node.active,
        );

        view.node.setAnchorPoint(cc.v2(0, 1));
        const start = this.computePos(p.x, -1);
        view.node.setPosition(start);
        const end = this.computePos(p.x, p.y);
        const dur = Math.abs(start.y - end.y) / 1400;
        const maybe = view.node as unknown as { stopAllActions?: () => void };
        if (typeof maybe.stopAllActions === "function") maybe.stopAllActions();

        setTimeout(
          () => {
            cc.tween(view.node as unknown as { position: cc.Vec3 })
              .to(dur, { position: new cc.Vec3(end.x, end.y, 0) })
              .start();
            setTimeout(() => {
              cc.tween(view.node as unknown as { scale: cc.Vec3 })
                .to(0.05, { scale: new cc.Vec3(1.1, 1.1, 1) })
                .to(0.05, { scale: new cc.Vec3(1, 1, 1) })
                .start();
            }, dur * 1000);
          },
          index * delayStep * 1000,
        );

        view.node.zIndex = this.board.rows - p.y - 1;
        this.tileViews[p.y][p.x] = view;
      }
    });
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
