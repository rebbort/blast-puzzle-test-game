import { Vec2 } from "cc";
import { Board } from "./Board";
import { EventEmitter2 } from "eventemitter2";
import { RemoveCommand } from "./commands/RemoveCommand";
import { FallCommand } from "./commands/FallCommand";
import { FillCommand } from "./commands/FillCommand";

/**
 * Executes a full player move by removing a group, letting tiles fall
 * and filling empty spaces. Commands are executed sequentially and the
 * method resolves once all operations are complete.
 */
export class MoveExecutor {
  constructor(
    private board: Board,
    private bus: EventEmitter2,
  ) {}

  async execute(group: Vec2[]): Promise<void> {
    if (group.length === 0) {
      throw new Error("MoveExecutor: group is empty");
    }

    // 1. Remove tiles and wait for completion
    const removeDone = this.wait("removeDone");
    new RemoveCommand(this.board, this.bus, group).execute();
    const [dirtyCols] = (await removeDone) as [number[]];

    // 2. Let tiles fall in affected columns
    const fallDone = this.wait("fallDone");
    new FallCommand(this.board, this.bus, dirtyCols).execute();
    const [emptySlots] = (await fallDone) as [Vec2[]];

    // 3. Fill empty spaces with new tiles
    const fillDone = this.wait("fillDone");
    new FillCommand(this.board, this.bus, emptySlots).execute();
    await fillDone;

    // Signal completion of the whole move
    this.bus.emit("MoveCompleted");
  }

  /**
   * Helper that returns a promise resolved when the given event fires.
   */
  private wait(event: string): Promise<unknown[]> {
    return new Promise((resolve) => {
      this.bus.once(event, (...args: unknown[]) => resolve(args));
    });
  }
}
