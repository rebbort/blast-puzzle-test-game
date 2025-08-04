import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import { EventNames } from "../events/EventNames";

/**
 * Subscribes to game events and plays matching sound effects when available.
 * Missing sound files are ignored silently.
 */
export class SoundController {
  /** Cache of loaded audio clips. */
  private static clips: Record<string, cc.AudioClip> = {};

  /** Registered handlers for cleanup. */
  private handlers: Record<string, (...args: unknown[]) => void> = {};

  constructor(private bus: InfrastructureEventBus) {
    // Map event names to sound asset base names (without extension).
    const map: Record<string, string> = {
      [EventNames.TilePressed]: "tile_click",
      [EventNames.InvalidTap]: "invalid_tap",
      [EventNames.FallDone]: "tile_fall",
      [EventNames.SwapDone]: "tile_swap",
      [EventNames.SuperTileCreated]: "super_tile",
      [EventNames.SuperTileActivated]: "super_tile_activated",
      [EventNames.BoosterActivated]: "tile_click",
      [EventNames.BoosterConsumed]: "booster_use",
      [EventNames.BoosterTargetSelected]: "booster_target",
      [EventNames.GameWon]: "game_win",
      [EventNames.GameLost]: "game_lost",
      [EventNames.TurnUsed]: "turn_used",
      [EventNames.TurnEnded]: "turn_end",
    };

    // Subscribe to each event in the map
    Object.keys(map).forEach((evt) => {
      const handler = () => SoundController.play(map[evt]);
      this.bus.on(evt, handler);
      this.handlers[evt] = handler;
    });
  }

  /** Remove listeners when controller is destroyed. */
  destroy(): void {
    Object.keys(this.handlers).forEach((evt) => {
      this.bus.off(evt, this.handlers[evt]);
    });
    this.handlers = {};
  }

  /** Load and play a clip by name, caching for subsequent use. */
  private static play(name: string): void {
    const cached = SoundController.clips[name];
    if (cached) {
      cc.audioEngine.playEffect(cached, false);
      return;
    }
    cc.resources.load(`sounds/${name}`, cc.AudioClip, (err, clip) => {
      if (err || !clip) return;
      SoundController.clips[name] = clip;
      cc.audioEngine.playEffect(clip, false);
    });
  }
}
