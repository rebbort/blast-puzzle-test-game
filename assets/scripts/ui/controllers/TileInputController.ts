const { ccclass } = cc._decorator;

import { loadBoardConfig } from "../../config/ConfigLoader";
import { EventBus as bus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";
import GameBoardController from "./GameBoardController";
import TileView from "../views/TileView";

@ccclass()
export default class TileInputController extends cc.Component {
  private boardCtrl!: GameBoardController;

  onLoad(): void {
    this.boardCtrl = this.getComponent(GameBoardController)!;
    if (this.node.width === 0 || this.node.height === 0) {
      const cfg = loadBoardConfig();
      this.node.width = cfg.cols * cfg.tileWidth;
      this.node.height = cfg.rows * cfg.tileHeight;
    }

    // Attach a single click listener on the tilesLayer node
    this.node.on(
      cc.Node.EventType.TOUCH_END,
      (e: cc.Event.EventTouch) => {
        const worldPos = e.getLocation();
        const local = this.node.convertToNodeSpaceAR(worldPos);
        // convert node-space coordinates to column/row using tile size
        const col = Math.floor(
          (local.x + this.node.width / 2) / loadBoardConfig().tileWidth,
        );
        const row = Math.floor(
          (this.node.height / 2 - (local.y - 12)) /
            loadBoardConfig().tileHeight,
        );
        this.handleTap(col, row);
      },
      this,
    );
  }

  handleTap(col: number, row: number): void {
    const view: TileView | undefined = this.boardCtrl.tileViews[row]?.[col];
    if (!view || !view.isInteractive()) {
      console.debug(
        `Tile tap ignored: falling=${view?.["isFalling"]} feedbackActive=${view?.["isFeedbackActive"]} at {${col},${row}}`,
      );
      return;
    }
    console.debug(`Tile tap feedback started at {${col},${row}}`);
    bus.emit(EventNames.GroupSelected, new cc.Vec2(col, row));
  }
}
