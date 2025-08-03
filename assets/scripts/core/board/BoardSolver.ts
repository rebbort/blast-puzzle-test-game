import { EventBus } from "../EventBus";
import { EventNames } from "../events/EventNames";
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
        console.info(
          `Activated SuperRow at (${pos.x},${pos.y}): removing row ${pos.y}`,
        );
        // All cells of the same row are affected. Duplicates are avoided
        // by the caller using a Set for the final group.
        return Array.from(
          { length: cfg.cols },
          (_, x) => new cc.Vec2(x, pos.y),
        );
      case TileKind.SuperCol:
        console.info(
          `Activated SuperCol at (${pos.x},${pos.y}): removing column ${pos.x}`,
        );
        // Entire column is removed regardless of color.
        return Array.from(
          { length: cfg.rows },
          (_, y) => new cc.Vec2(pos.x, y),
        );
      case TileKind.SuperBomb: {
        const radius = 1;
        console.info(
          `Activated SuperBomb at (${pos.x},${pos.y}): removing radius ${radius}`,
        );
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
        console.info(
          `Activated SuperClear at (${pos.x},${pos.y}): removing entire board`,
        );
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
        if (tile.kind !== TileKind.Normal) {
          throw new Error(`Unhandled super tile kind: ${tile.kind}`);
        }
        // Normal tiles do not expand the group.
        return [pos];
    }
  }

  /**
   * Recursively expands a given group by activating any super tiles within.
   *
   * The algorithm mirrors the super-tile expansion portion of {@link findGroup}
   * but works on an arbitrary set of coordinates. This allows callers that
   * construct groups manually (e.g. row/column clears or bomb blasts) to reuse
   * the same chain-reaction logic.
   *
   * @param group Initial coordinates to expand
   * @returns New array including all tiles affected by triggered super tiles
   */
  expandBySupers(group: cc.Vec2[]): cc.Vec2[] {
    const resultSet = new Set<string>(group.map((p) => `${p.x},${p.y}`));
    const queue = group.filter((p) => {
      const t = this.board.tileAt(p);
      return t !== null && t.kind !== TileKind.Normal;
    });

    while (queue.length > 0) {
      const p = queue.pop() as cc.Vec2;
      const tile = this.board.tileAt(p);
      if (!tile) continue;
      for (const extra of this.expandGroupForSuper(tile, p)) {
        const k = `${extra.x},${extra.y}`;
        if (!resultSet.has(k)) {
          resultSet.add(k);
          const t = this.board.tileAt(extra);
          if (t && t.kind !== TileKind.Normal) {
            queue.push(extra);
          }
        }
      }
    }

    return Array.from(resultSet).map((k) => {
      const [x, y] = k.split(",").map(Number);
      return new cc.Vec2(x, y);
    });
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
    // If the player taps a super tile directly, it should activate
    // immediately without collecting adjacent tiles of the same color.
    if (startTile.kind !== TileKind.Normal) {
      const result = this.expandBySupers([start]);
      EventBus.emit(EventNames.GroupFound, result);
      return result;
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

      const tile = this.board.tileAt(p);
      if (!tile || tile.color !== startColor || tile.kind !== TileKind.Normal)
        continue;

      baseGroup.push(p);
      // Diagonal tiles are ignored to match game rules.
      for (const n of this.board.neighbors4(p)) {
        const nKey = `${n.x},${n.y}`;
        if (!colorVisited.has(nKey)) {
          colorStack.push(n);
        }
      }
    }

    const result = this.expandBySupers(baseGroup);

    // Notify listeners that a group has been found
    EventBus.emit(EventNames.GroupFound, result);
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
