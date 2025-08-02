const { ccclass, property } = cc._decorator;

import { Board } from "../../core/board/Board";
import { BoardGenerator } from "../../core/board/BoardGenerator";
import { loadBoardConfig } from "../../config/ConfigLoader";
import TileView from "../views/TileView";
import MoveFlowController from "./MoveFlowController";
import FillController from "./FillController";
import { computeTilePosition } from "../utils/PositionUtils";
import { EventBus as bus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";

@ccclass()
export default class GameBoardController extends cc.Component {
  /** Базовый префаб узла тайла. */
  @property(cc.Prefab)
  tileNodePrefab!: cc.Prefab;
  /** Parent node for all tile instances. */
  @property(cc.Node)
  tilesLayer!: cc.Node;

  /** Board model generated on load. */
  private board!: Board;

  getBoard(): Board {
    return this.board;
  }
  /** Matrix of view components mirroring board state. */
  tileViews: TileView[][] = [];

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
    // Attach animation controllers on the same node
    const flow = this.node.addComponent(MoveFlowController);
    flow.tilesLayer = this.tilesLayer;
    const fill = this.node.addComponent(FillController);
    fill.tileNodePrefab = this.tileNodePrefab;
    fill.tilesLayer = this.tilesLayer;
    bus.on(EventNames.BoosterConfirmed, this.onBoosterConfirmed, this);
    // 4) Создаем дебаг сетку
    // this.createDebugGrid();
  }

  /**
   * Instantiates tile prefabs for each board cell and saves TileView references.
   */
  private spawnAllTiles(): void {
    for (let r = 0; r < this.board.rows; r++) {
      this.tileViews[r] = [];
      for (let c = 0; c < this.board.cols; c++) {
        const tileData = this.board.tileAt(new cc.Vec2(c, r))!;
        const node = cc.instantiate(this.tileNodePrefab);
        node.parent = this.tilesLayer;
        // устанавливаем anchorPoint на (0, 1) для origin (0, 1)
        node.setAnchorPoint(cc.v2(0, 1));
        // позиционируем точно как в Core
        node.setPosition(computeTilePosition(c, r, this.board));
        // устанавливаем z-index: каждый следующий слой ниже
        node.zIndex = this.board.rows - r - 1;
        // сохраняем TileView для обновлений
        const view = node.getComponent(TileView) as TileView;
        view.apply(tileData);
        view.boardPos = cc.v2(c, r);
        this.tileViews[r][c] = view;
      }
    }
  }

  /**
   * Spawns a single tile view at the given board position and stores it.
   */
  spawn(pos: cc.Vec2): TileView {
    const tileData = this.board.tileAt(pos)!;
    const node = cc.instantiate(this.tileNodePrefab);
    node.parent = this.tilesLayer;
    node.setAnchorPoint(cc.v2(0, 1));
    node.setPosition(computeTilePosition(pos.x, pos.y, this.board));
    node.zIndex = this.board.rows - pos.y - 1;
    const view = node.getComponent(TileView) as TileView;
    view.apply(tileData);
    view.boardPos = cc.v2(pos.x, pos.y);
    this.tileViews[pos.y][pos.x] = view;
    return view;
  }

  private onBoosterConfirmed({ position }: { position: cc.Vec2 }): void {
    const view = this.tileViews[position.y]?.[position.x];
    view?.activateSuper();
  }

  /**
   * Creates debug grid to visualize cell boundaries.
   */
  private createDebugGrid(): void {
    const cfg = loadBoardConfig();

    // Создаем контейнер для сетки
    const gridContainer = new cc.Node("DebugGrid");
    gridContainer.parent = this.tilesLayer;
    gridContainer.zIndex = 1000; // Поверх всех тайлов

    // Рисуем вертикальные линии
    for (let c = 0; c <= this.board.cols; c++) {
      const line = new cc.Node("VLine");
      line.parent = gridContainer;

      const graphics = line.addComponent(cc.Graphics);
      graphics.lineWidth = 2;
      graphics.strokeColor = cc.Color.RED;

      const startX = (c - this.board.cols / 2) * cfg.tileWidth;
      const startY = (this.board.rows / 2) * cfg.tileHeight;
      const endY = (-this.board.rows / 2) * cfg.tileHeight;

      graphics.moveTo(startX, startY);
      graphics.lineTo(startX, endY);
      graphics.stroke();
    }

    // Рисуем горизонтальные линии
    for (let r = 0; r <= this.board.rows; r++) {
      const line = new cc.Node("HLine");
      line.parent = gridContainer;

      const graphics = line.addComponent(cc.Graphics);
      graphics.lineWidth = 2;
      graphics.strokeColor = cc.Color.BLUE;

      const startY = (this.board.rows / 2 - r) * cfg.tileHeight;
      const startX = (-this.board.cols / 2) * cfg.tileWidth;
      const endX = (this.board.cols / 2) * cfg.tileWidth;

      graphics.moveTo(startX, startY);
      graphics.lineTo(endX, startY);
      graphics.stroke();
    }

    // Добавляем координаты клеток
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const label = new cc.Node("CellLabel");
        label.parent = gridContainer;

        const text = label.addComponent(cc.Label);
        text.string = `${c},${r}`;
        text.fontSize = 16;
        text.node.color = cc.Color.YELLOW;

        const pos = computeTilePosition(c, r, this.board);
        label.setPosition(
          pos.x + cfg.tileWidth / 2,
          pos.y - cfg.tileHeight / 2,
        );
      }
    }
  }
}
