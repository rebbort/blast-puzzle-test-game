import { loadBoardConfig } from "../../config/ConfigLoader";
import type { Board } from "../../core/board/Board";

/**
 * Computes tile position from column and row indices.
 * Uses board size and configured tile size to match the core model.
 */
export function computeTilePosition(
  col: number,
  row: number,
  board: Board,
): cc.Vec2 {
  const cfg = loadBoardConfig();
  const x = (col - board.cols / 2) * cfg.tileWidth + cfg.tileWidth / 2;
  const y = (board.rows / 2 - row) * cfg.tileHeight - cfg.tileHeight / 2;
  return cc.v2(x, y);
}
