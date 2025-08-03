import { RocketVfxController } from "./RocketVfxController";

/**
 * Пример использования RocketVfxController.
 * Показывает, как запустить эффект ракеты с двумя хвостами.
 */
export class RocketVfxExample {
  /**
   * Запускает эффект ракеты в указанной позиции.
   * @param position Позиция для запуска эффекта
   * @param prefab Префаб с RocketVfxController
   */
  static async playRocketEffect(
    position: cc.Vec2,
    prefab: cc.Prefab,
  ): Promise<void> {
    // Создаем экземпляр префаба
    const node = cc.instantiate(prefab);

    // Добавляем в сцену
    const scene = cc.director.getScene?.();
    if (scene) {
      scene.addChild(node);
      node.setPosition(position);
      node.zIndex = 9999; // Поверх всего
    }

    // Получаем контроллер
    const controller = node.getComponent(RocketVfxController);
    if (!controller) {
      console.error("RocketVfxController not found on prefab");
      node.destroy();
      return;
    }

    // Запускаем эффект и ждем завершения
    await controller.play();
  }

  /**
   * Запускает эффект ракеты с кастомными параметрами.
   * @param position Позиция для запуска эффекта
   * @param prefab Префаб с RocketVfxController
   * @param options Кастомные параметры
   */
  static async playRocketEffectWithOptions(
    position: cc.Vec2,
    prefab: cc.Prefab,
    options: {
      speed?: number;
      duration?: number;
      leftAngle?: number;
      rightAngle?: number;
    } = {},
  ): Promise<void> {
    const node = cc.instantiate(prefab);
    const scene = cc.director.getScene?.();
    if (scene) {
      scene.addChild(node);
      node.setPosition(position);
      node.zIndex = 9999;
    }

    const controller = node.getComponent(RocketVfxController);
    if (!controller) {
      console.error("RocketVfxController not found on prefab");
      node.destroy();
      return;
    }

    // Применяем кастомные параметры
    if (options.speed !== undefined) controller.speed = options.speed;
    if (options.duration !== undefined) controller.duration = options.duration;
    if (options.leftAngle !== undefined)
      controller.leftAngle = options.leftAngle;
    if (options.rightAngle !== undefined)
      controller.rightAngle = options.rightAngle;

    await controller.play();
  }
}

export default RocketVfxExample;
