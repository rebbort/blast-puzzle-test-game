import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import { Board } from "../board/Board";
import { EventNames } from "../events/EventNames";

export interface MoveSequenceStatus {
  step: string;
  unsynced: boolean;
}

type StatusListener = (s: MoveSequenceStatus) => void;

export class MoveSequenceLogger {
  static current: MoveSequenceLogger | null = null;

  private removed = 0;
  private added = 0;
  private cycles = 0;
  private fillTimer: ReturnType<typeof setTimeout> | null = null;
  private status: MoveSequenceStatus = { step: "init", unsynced: false };
  private listeners: StatusListener[] = [];
  private fallDoneHandler = (): void => this.update("fall done");

  constructor(
    private bus: InfrastructureEventBus,
    private board: Board,
  ) {
    MoveSequenceLogger.current = this;
    bus.on(EventNames.GroupSelected, this.onGroupSelected, this);
    bus.on(EventNames.TilesRemoved, this.onTilesRemoved, this);
    bus.on(EventNames.FallDone, this.fallDoneHandler, this);
    bus.on(EventNames.FillStarted, this.onFillStarted, this);
    bus.on(EventNames.FillDone, this.onFillDone, this);
    bus.on(EventNames.MoveCompleted, this.onMoveCompleted, this);
  }

  onStatusChange(cb: StatusListener): void {
    this.listeners.push(cb);
  }

  getStatus(): MoveSequenceStatus {
    return this.status;
  }

  private onGroupSelected(): void {
    this.removed = 0;
    this.added = 0;
    this.cycles = 0;
    this.update("group selected", false);
  }

  private onTilesRemoved(positions: cc.Vec2[]): void {
    this.removed += positions.length;
    this.update("tiles removed");
  }

  private onFillStarted(): void {
    if (this.fillTimer) clearTimeout(this.fillTimer);
    this.fillTimer = setTimeout(() => {
      console.warn("MoveSequenceLogger: FillDone not received", {
        events: this.status.step,
        board: this.dumpBoard(),
      });
      this.update("fill timeout", true);
      this.fillTimer = null;
    }, 600);
    this.update("fill started");
  }

  private onFillDone(newTiles?: { pos: cc.Vec2; tile: unknown }[]): void {
    if (this.fillTimer) {
      clearTimeout(this.fillTimer);
      this.fillTimer = null;
    }
    this.added += newTiles?.length ?? 0;
    this.cycles++;
    this.update("fill done");
  }

  private onMoveCompleted(): void {
    const chain = this.cycles > 1 ? "yes" : "no";
    console.info(
      `MoveSequence: removed ${this.removed}, added ${this.added}, chain ${chain}`,
    );
    this.update("move completed");
  }

  private update(step: string, unsynced = false): void {
    this.status = { step, unsynced };
    this.listeners.forEach((l) => l(this.status));
  }

  private dumpBoard(): string {
    const rows: string[] = [];
    for (let y = 0; y < this.board.rows; y++) {
      const cols: string[] = [];
      for (let x = 0; x < this.board.cols; x++) {
        const t = this.board.tileAt(new cc.Vec2(x, y));
        cols.push(t ? (t.color as string)[0] : "_");
      }
      rows.push(cols.join(""));
    }
    return rows.join("|");
  }

  destroy(): void {
    this.bus.off(EventNames.GroupSelected, this.onGroupSelected, this);
    this.bus.off(EventNames.TilesRemoved, this.onTilesRemoved, this);
    this.bus.off(EventNames.FallDone, this.fallDoneHandler, this);
    this.bus.off(EventNames.FillStarted, this.onFillStarted, this);
    this.bus.off(EventNames.FillDone, this.onFillDone, this);
    this.bus.off(EventNames.MoveCompleted, this.onMoveCompleted, this);
    if (this.fillTimer) {
      clearTimeout(this.fillTimer);
      this.fillTimer = null;
    }
  }
}
