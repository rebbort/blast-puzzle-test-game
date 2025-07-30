const { ccclass, property } = cc._decorator;

import { Board } from "../../core/board/Board";
import { BoardGenerator } from "../../core/board/BoardGenerator";
import { loadBoardConfig } from "../../config/ConfigLoader";
import TileView from "../views/TileView";

@ccclass("GameBoardController")
export default class GameBoardController extends cc.Component {
  /** Prefab used to instantiate tile nodes. */
  @property(cc.Prefab)
  tilePrefab!: cc.Prefab;
  /** Parent node for all tile instances. */
  @property(cc.Node)
  tilesLayer!: cc.Node;

  /** Board model generated on load. */
  private board!: Board;
  /** Matrix of view components mirroring board state. */
  private tileViews: TileView[][] = [];

  /**
   * Generates the game board when this controller loads.
   *
   * 1. Loads the board configuration from storage.
   * 2. Uses {@link BoardGenerator} to create a board model.
   * 3. Spawns tile prefabs for every cell and stores their views.
   */
  onLoad(): void {
    // 1) Загрузить конфиг
    const cfg = loadBoardConfig();
    // 2) Сгенерировать Board
    this.board = new BoardGenerator().generate(cfg);
    // 3) Спавнить по каждой клетке
    this.spawnAllTiles();
  }

  /**
   * Instantiates tile prefabs for each board cell and saves TileView references.
   */
  private spawnAllTiles(): void {
    for (let r = 0; r < this.board.rows; r++) {
      this.tileViews[r] = [];
      for (let c = 0; c < this.board.cols; c++) {
        const tileData = this.board.tileAt(new cc.Vec2(c, r))!;
        const node = cc.instantiate(this.tilePrefab);
        node.parent = this.tilesLayer;
        // позиционируем точно как в Core
        node.setPosition(this.computePos(c, r));
        // сохраняем TileView для обновлений
        const view = node.getComponent(TileView) as TileView;
        view.apply(tileData);
        this.tileViews[r][c] = view;
      }
    }
  }

  /**
   * Computes node position from column and row indices.
   * Uses board size and configured tile size to match the core model.
   */
  private computePos(col: number, row: number): cc.Vec2 {
    const size = loadBoardConfig().tileSize;
    const x = (col - this.board.cols / 2 + 0.5) * size;
    const y = (this.board.rows / 2 - row - 0.5) * size;
    return cc.v2(x, y);
  }
}
