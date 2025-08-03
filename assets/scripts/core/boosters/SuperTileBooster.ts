import { Booster } from "./Booster";
import { Board } from "../board/Board";
import { Tile, TileKind } from "../board/Tile";
import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import { EventNames } from "../events/EventNames";
import { BoosterService } from "./BoosterService";
import TileView from "../../ui/views/TileView";

/**
 * Generic booster that transforms a single tile into a specific super tile.
 * The booster waits for the player to select a tile and immediately consumes
 * a charge on placement. The created super tile can be activated later as a
 * normal tile interaction without spending another charge.
 */
export class SuperTileBooster implements Booster {
  id: string;
  charges: number;

  constructor(
    id: string,
    private board: Board,
    private getView: (p: cc.Vec2) => TileView | undefined,
    private bus: InfrastructureEventBus,
    private svc: BoosterService,
    charges: number,
    private kind: TileKind,
  ) {
    this.id = id;
    this.charges = charges;
  }

  canActivate(): boolean {
    return this.charges > 0;
  }

  start(): void {
    this.bus.once(EventNames.GroupSelected, (pos: unknown) => {
      if (this.charges <= 0) return;
      const p = pos as cc.Vec2;
      const tile = this.board.tileAt(p);
      if (!tile || tile.kind !== TileKind.Normal) return;
      // Списываем заряд при установке, чтобы отмена не допускалась
      // и игрок не мог бесконечно откладывать оплату за созданный супер-тайл.
      // Активация эффекта произойдёт позже обычным нажатием по тайлу,
      // поэтому логика зарядов отделена от последующего использования.
      this.svc.consume(this.id);
      const superTile: Tile = { ...tile, kind: this.kind };
      this.board.setTile(p, superTile);
      const view = this.getView(p);
      view?.apply(superTile);
      this.bus.emit(EventNames.SuperTilePlaced, {
        kind: this.kind,
        position: p,
      });
    });
  }
}
