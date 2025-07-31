// Глобальная шина событий теперь основана на cc.EventTarget with diagnostics
import { InfrastructureEventBus } from "../infrastructure/InfrastructureEventBus";

/**
 * Глобальный экземпляр EventBus используется во всех частях игры.
 * Мы отказались от сторонней библиотеки eventemitter2
 * в пользу обёртки на cc.EventTarget с отслеживанием подписчиков.
 */
export const EventBus = new InfrastructureEventBus();
