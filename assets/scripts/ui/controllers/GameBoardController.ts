const { ccclass, property } = cc._decorator;

import { Board } from "../../core/board/Board";
import { BoardGenerator } from "../../core/board/BoardGenerator";
import { loadBoardConfig } from "../../config/ConfigLoader";
import TileView from "../views/TileView";
import type { Tile } from "../../core/board/Tile";
import { TileKind } from "../../core/board/Tile";

@ccclass("GameBoardController")
export default class GameBoardController extends cc.Component {
  /** Prefabs for normal tile colors. */
  @property(cc.Prefab)
  tileRedPrefab!: cc.Prefab;
  @property(cc.Prefab)
  tileBluePrefab!: cc.Prefab;
  @property(cc.Prefab)
  tileGreenPrefab!: cc.Prefab;
  @property(cc.Prefab)
  tileYellowPrefab!: cc.Prefab;
  @property(cc.Prefab)
  tilePurplePrefab!: cc.Prefab;

  /** Prefabs for booster tiles. */
  @property(cc.Prefab)
  boosterRowPrefab!: cc.Prefab;
  @property(cc.Prefab)
  boosterColPrefab!: cc.Prefab;
  @property(cc.Prefab)
  boosterBombPrefab!: cc.Prefab;
  @property(cc.Prefab)
  boosterClearPrefab!: cc.Prefab;
  /** Parent node for all tile instances. */
  @property(cc.Node)
  tilesLayer!: cc.Node;

  /** Map from color/kind to prefab for quick lookup. */
  private prefabMap: Record<string, cc.Prefab> = {};

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
    // build prefab lookup once prefabs are assigned
    this.initPrefabMap();
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
        const node = cc.instantiate(this.prefabFor(tileData));
        node.parent = this.tilesLayer;
        // устанавливаем anchorPoint на (0, 1) для origin (0, 1)
        node.setAnchorPoint(cc.v2(0, 1));
        // позиционируем точно как в Core
        node.setPosition(this.computePos(c, r));
        // устанавливаем z-index: каждый следующий слой ниже
        node.zIndex = this.board.rows - r - 1;
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
    const cfg = loadBoardConfig();
    const x = (col - this.board.cols / 2 + 0.5) * cfg.tileWidth;
    const y = (this.board.rows / 2 - row - 0.5) * cfg.tileHeight - 12;
    return cc.v2(x, y);
  }

  /** Builds a map from color/kind to prefab for quick access. */
  private initPrefabMap(): void {
    this.prefabMap = {
      "Normal-red": this.tileRedPrefab,
      "Normal-blue": this.tileBluePrefab,
      "Normal-green": this.tileGreenPrefab,
      "Normal-yellow": this.tileYellowPrefab,
      "Normal-purple": this.tilePurplePrefab,
      SuperRow: this.boosterRowPrefab,
      SuperCol: this.boosterColPrefab,
      SuperBomb: this.boosterBombPrefab,
      SuperClear: this.boosterClearPrefab,
    };
  }

  /** Selects prefab according to tile color and kind. */
  private prefabFor(tile: Tile): cc.Prefab {
    if (tile.kind === TileKind.Normal) {
      return this.prefabMap[`Normal-${tile.color}`];
    }
    const key = TileKind[tile.kind] as keyof typeof TileKind;
    return this.prefabMap[key];
  }
}
