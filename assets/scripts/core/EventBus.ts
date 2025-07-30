// Глобальная шина событий теперь основана на cc.EventTarget
import { ExtendedEventTarget } from "../infrastructure/ExtendedEventTarget";

/**
 * Глобальный экземпляр EventBus используется во всех частях игры.
 * Мы отказались от сторонней библиотеки eventemitter2
 * в пользу упрощённой обёртки на cc.EventTarget.
 */
export const EventBus = new ExtendedEventTarget();
