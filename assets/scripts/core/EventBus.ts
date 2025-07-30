// Глобальная шина событий теперь основана на cc.EventTarget
import { EventBus as BaseBus } from "../infrastructure/EventBus";

/**
 * Глобальный экземпляр EventBus используется во всех частях игры.
 * Мы отказались от сторонней библиотеки eventemitter2
 * в пользу упрощённой обёртки на cc.EventTarget.
 */
export const EventBus = new BaseBus();
