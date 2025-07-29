import { Vec2 } from "cc";
import { EventBus } from "../EventBus";
import { Board } from "./Board";

/**
 * Provides algorithms for analyzing the board state.
 */
export class BoardSolver {
  constructor(private board: Board) {}

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
  findGroup(start: Vec2): Vec2[] {
    // Return empty when starting point is invalid or empty
    if (!this.board.inBounds(start)) {
      return [];
    }
    const startColor = this.board.colorAt(start);
    if (!startColor) {
      return [];
    }

    const result: Vec2[] = [];
    const stack: Vec2[] = [start];
    // "visited" tracks processed cells to prevent infinite loops
    const visited = new Set<string>();

    while (stack.length > 0) {
      const p = stack.pop() as Vec2;
      const key = `${p.x},${p.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (this.board.colorAt(p) !== startColor) continue;

      result.push(p);
      // Only 4-directional neighbors are used because diagonal tiles
      // are not considered adjacent in this game.
      for (const n of this.board.neighbors4(p)) {
        const nKey = `${n.x},${n.y}`;
        if (!visited.has(nKey)) {
          stack.push(n);
        }
      }
    }

    // Notify listeners that a group has been found
    EventBus.emit("GroupFound", result);
    return result;
  }
}
