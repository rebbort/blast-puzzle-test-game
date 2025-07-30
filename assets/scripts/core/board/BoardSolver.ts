import { EventBus } from "../EventBus";
import { Board } from "./Board";
import { Tile, TileKind } from "./Tile";
import { BoardConfig } from "../../config/ConfigLoader";

/**
 * Provides algorithms for analyzing the board state.
 */
export class BoardSolver {
  constructor(private board: Board) {}

  /**
   * Expands removal area when a super tile is part of a group.
   * Each branch covers a specific {@link TileKind}.
   * A Set is not used here because the caller performs deduplication.
   */
  expandGroupForSuper(tile: Tile, pos: cc.Vec2): cc.Vec2[] {
    const cfg = (this.board as unknown as { cfg: BoardConfig }).cfg;
    switch (tile.kind) {
      case TileKind.SuperRow:
        // All cells of the same row are affected. Duplicates are avoided
        // by the caller using a Set for the final group.
        return Array.from(
          { length: cfg.cols },
          (_, x) => new cc.Vec2(x, pos.y),
        );
      case TileKind.SuperCol:
        // Entire column is removed regardless of color.
        return Array.from(
          { length: cfg.rows },
          (_, y) => new cc.Vec2(pos.x, y),
        );
      case TileKind.SuperBomb: {
        // Radius-1 Chebyshev neighbourhood around the center.
        const radius = 1;
        const cells: cc.Vec2[] = [];
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) <= radius) {
              const p = new cc.Vec2(pos.x + dx, pos.y + dy);
              if (this.board.inBounds(p)) cells.push(p);
            }
          }
        }
        return cells;
      }
      case TileKind.SuperClear: {
        // Every tile on the board will be removed.
        const cells: cc.Vec2[] = [];
        for (let y = 0; y < cfg.rows; y++) {
          for (let x = 0; x < cfg.cols; x++) {
            cells.push(new cc.Vec2(x, y));
          }
        }
        return cells;
      }
      default:
        // Normal tiles do not expand the group.
        return [pos];
    }
  }

  /**
   * Finds all coordinates of tiles connected to the starting point
   * in four directions that share the same color.
   *
   * Uses a flood-fill algorithm with an explicit stack to avoid
   * potential stack overflows from deep recursion.
   *
   * @param start Starting board coordinates
   * @returns Array of coordinates belonging to the found group
   */
  findGroup(start: cc.Vec2): cc.Vec2[] {
    // Return empty when starting point is invalid or empty
    if (!this.board.inBounds(start)) {
      return [];
    }
    const startTile = this.board.tileAt(start);
    if (!startTile) {
      return [];
    }

    const startColor = startTile.color;

    // First, collect all connected tiles of the same color.
    const colorVisited = new Set<string>();
    const colorStack: cc.Vec2[] = [start];
    const baseGroup: cc.Vec2[] = [];

    while (colorStack.length > 0) {
      const p = colorStack.pop() as cc.Vec2;
      const key = `${p.x},${p.y}`;
      if (colorVisited.has(key)) continue;
      colorVisited.add(key);

      if (this.board.colorAt(p) !== startColor) continue;

      baseGroup.push(p);
      // Diagonal tiles are ignored to match game rules.
      for (const n of this.board.neighbors4(p)) {
        const nKey = `${n.x},${n.y}`;
        if (!colorVisited.has(nKey)) {
          colorStack.push(n);
        }
      }
    }

    // Prepare final set and queue of super tiles to expand.
    const resultSet = new Set<string>(baseGroup.map((p) => `${p.x},${p.y}`));
    const superQueue = baseGroup.filter((p) => {
      const t = this.board.tileAt(p);
      return t !== null && t.kind !== TileKind.Normal;
    });

    // Process super tiles one by one adding their affected cells.
    while (superQueue.length > 0) {
      const p = superQueue.pop() as cc.Vec2;
      const tile = this.board.tileAt(p);
      if (!tile) continue;
      for (const extra of this.expandGroupForSuper(tile, p)) {
        const k = `${extra.x},${extra.y}`;
        if (!resultSet.has(k)) {
          resultSet.add(k);
          const t = this.board.tileAt(extra);
          if (t && t.kind !== TileKind.Normal) {
            // Queue additional super tiles to trigger chain reactions.
            superQueue.push(extra);
          }
        }
      }
    }

    const result = Array.from(resultSet).map((k) => {
      const [x, y] = k.split(",").map(Number);
      return new cc.Vec2(x, y);
    });

    // Notify listeners that a group has been found
    EventBus.emit("GroupFound", result);
    return result;
  }

  /**
   * Determines whether any valid moves exist on the board.
   * A move is considered available when two orthogonally
   * adjacent tiles share the same color.
   */
  hasMoves(): boolean {
    let found = false;
    // Iterate over all tiles on the board
    this.board.forEach((p, tile) => {
      if (found) return; // early exit when at least one move is found
      // Check 4-directional neighbours for a tile of the same color
      for (const n of this.board.neighbors4(p)) {
        const other = this.board.tileAt(n);
        if (other && other.color === tile.color) {
          found = true;
          break;
        }
      }
    });
    return found;
  }
}
