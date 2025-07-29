import { EventEmitter2 } from 'eventemitter2';

/**
 * Global event bus instance used across the game. Utilizes
 * EventEmitter2 for a robust and well-tested implementation.
 */
export const EventBus = new EventEmitter2();
