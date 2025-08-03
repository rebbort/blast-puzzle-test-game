// Global event bus now based on cc.EventTarget with diagnostics
import { InfrastructureEventBus } from "../infrastructure/InfrastructureEventBus";

/**
 * Global EventBus instance used in all parts of the game.
 */
export const EventBus = new InfrastructureEventBus();
