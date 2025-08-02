# Настройка запуска игры

## Что было сделано:

### 1. Обновлен BoosterSelectController

- Добавлен обработчик клика на PlayButton
- При клике отправляется событие `BoostersSelected`

### 2. Создан GameStateController

- Управляет переключением между экранами
- Слушает событие `BoostersSelected`
- Автоматически скрывает BoosterSelectPopup и показывает GameBoard
- **Ссылки на ноды назначаются в редакторе**

## Настройка в редакторе:

### Шаг 1: Добавьте GameStateController

1. Выберите ноду `Canvas` в иерархии
2. Добавьте компонент `GameStateController`

### Шаг 2: Назначьте ссылки в GameStateController

В компоненте `GameStateController` назначьте:

- **Booster Select Popup** - перетащите ноду `BoosterSelectPopup`
- **Game Board** - перетащите ноду `GameBoard`

### Шаг 3: Проверьте BoosterSelectAnimationController

В компоненте `BoosterSelectAnimationController` назначьте:

- **Game Name Label** - нода с названием игры
- **Select Booster Label** - нода с текстом "Выбери бустер"
- **Booster Select Background** - фон попапа
- **Booster Slots** - массив из 4 слотов бустеров
- **Play Button** - кнопка Play

### Шаг 4: Проверьте структуру нод

Убедитесь, что в иерархии есть:

- `Canvas/BoosterSelectPopup` - попап выбора бустеров
- `Canvas/GameBoard` - игровая доска

## Как это работает:

1. **При запуске игры:**
   - BoosterSelectPopup активен
   - GameBoard неактивен

2. **При клике на PlayButton:**
   - Отправляется событие `BoostersSelected`
   - GameStateController слушает это событие
   - BoosterSelectPopup скрывается
   - GameBoard активируется

3. **Игра запускается:**
   - GameScene получает событие `BoostersSelected`
   - Инициализируется FSM и игровая логика

## Тестирование:

### Проверка ссылок в консоли:

```javascript
// Проверить GameStateController
const gameStateController = cc
  .find("Canvas")
  .getComponent("GameStateController");
gameStateController.checkReferences();

// Проверить BoosterSelectAnimationController
const animController = cc
  .find("Canvas/BoosterSelectPopup")
  .getComponent("BoosterSelectAnimationController");
// Ссылки проверяются автоматически при старте
```

### Принудительный запуск игры:

```javascript
// Принудительно запустить игру
EventBus.emit(EventNames.BoostersSelected, {
  teleport: 0,
  superCol: 0,
  superRow: 0,
  bomb: 0,
});

// Или переключить экраны вручную
gameStateController.switchToGameBoard();
gameStateController.switchToBoosterSelection();
```

## Возможные проблемы:

1. **Ссылки не назначены** - назначьте все ссылки в редакторе
2. **GameBoard не найден** - проверьте путь в иерархии
3. **События не работают** - убедитесь что EventBus правильно настроен
4. **Контроллеры не найдены** - проверьте что компоненты добавлены

## Диагностика:

При запуске игры в консоли должны появиться сообщения:

- ✅ "GameStateController References" - если ссылки назначены
- ❌ "not assigned" - если ссылки не назначены

## Дополнительные возможности:

- `switchToBoosterSelection()` - вернуться к выбору бустеров
- `switchToGameBoard()` - переключиться к игровой доске
- `checkReferences()` - проверить назначенные ссылки
