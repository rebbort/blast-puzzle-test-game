import { Board } from "../Board";
import { InfrastructureEventBus } from "../../../infrastructure/InfrastructureEventBus";
import { ICommand } from "./ICommand";
import { MoveExecutor } from "../MoveExecutor";
import { BoardSolver } from "../BoardSolver";

/**
 * Collapses all tiles within radius R from the center.
 */
export class BombCommand implements ICommand {
  constructor(
    private board: Board,
    private center: cc.Vec2,
    private radius: number,
    private bus: InfrastructureEventBus,
  ) {}

  async execute(): Promise<void> {
    // Collect coordinates around the center, including the center cell itself.
    // Iterate over the square [-R, R] and use the condition
    // max(|dx|, |dy|) <= R, which corresponds to the Chebyshev radius.
    // Ignore points that are out of board bounds.
    const group: cc.Vec2[] = [];
    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dy = -this.radius; dy <= this.radius; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) <= this.radius) {
          const p = new cc.Vec2(this.center.x + dx, this.center.y + dy);
          if (this.board.inBounds(p)) group.push(p);
        }
      }
    }

    // Expand the group to trigger the effects of any super tiles.
    const expanded = new BoardSolver(this.board).expandBySupers(group);

    // Execute the standard pipeline: remove → fall → fill.
    // Use MoveExecutor to ensure that other tiles fall and empty positions
    // are filled with new tiles.
    await new MoveExecutor(this.board, this.bus).execute(expanded);
  }
}
