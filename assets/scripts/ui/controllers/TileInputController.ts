const { ccclass } = cc._decorator;

import { loadBoardConfig } from "../../config/ConfigLoader";
import { EventBus as bus } from "../../core/EventBus";

@ccclass("TileInputController")
export default class TileInputController extends cc.Component {
  onLoad(): void {
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
          (this.node.height / 2 - local.y) / loadBoardConfig().tileHeight,
        );
        bus.emit("GroupSelected", { x: col, y: row });
      },
      this,
    );
  }
}
