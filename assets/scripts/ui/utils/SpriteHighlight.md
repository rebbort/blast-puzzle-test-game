# SpriteHighlight - Утилита для выделения спрайтов

## Обзор

`SpriteHighlight` - это компонент для выделения спрайтов в Cocos Creator 2D. Применяет цветовой тинт к спрайту для создания эффекта выделения.

## Принцип работы

- ✅ **Простота** - только тинт, без копирования спрайтов
- ✅ **Производительность** - минимальные затраты ресурсов
- ✅ **Переключатель** - легко включать/выключать выделение
- ✅ **Сохранение состояния** - запоминает оригинальные значения

## Свойства

### highlightColor: cc.Color

Цвет выделения. По умолчанию: `cc.Color.YELLOW`

### highlightOpacity: number

Прозрачность выделения (0 - 255). По умолчанию: `255`

## API

### Основные методы

#### `toggleHighlight(): void`

Переключает состояние выделения (включить/выключить).

#### `setHighlight(): void`

Устанавливает выделение.

#### `clearHighlight(): void`

Убирает выделение.

#### `isHighlightedState(): boolean`

Проверяет, выделен ли спрайт.

#### `setHighlightColor(color: cc.Color): void`

Изменяет цвет выделения.

#### `setHighlightOpacity(opacity: number): void`

Изменяет прозрачность выделения.

#### `updateOriginalValues(): void`

Обновляет оригинальные значения (если спрайт изменился).

#### `resetToOriginal(): void`

Сбрасывает к оригинальным значениям.

## Использование

### 1. Добавление компонента

```typescript
// Добавьте компонент к ноде со спрайтом
const highlight = node.addComponent(SpriteHighlight);
```

### 2. Настройка в редакторе

- Выберите ноду со спрайтом
- Добавьте компонент `SpriteHighlight`
- Настройте свойства в инспекторе:
  - **Highlight Color** - цвет выделения
  - **Highlight Opacity** - прозрачность (0 - 255)

### 3. Программная настройка

```typescript
const highlight = node.getComponent(SpriteHighlight);

// Переключение выделения
highlight.toggleHighlight();

// Установка выделения
highlight.setHighlight();

// Убирание выделения
highlight.clearHighlight();

// Проверка состояния
if (highlight.isHighlightedState()) {
  console.log("Спрайт выделен");
}

// Изменение цвета
highlight.setHighlightColor(cc.Color.RED);

// Изменение прозрачности
highlight.setHighlightOpacity(128);
```

## Примеры использования

### Простое выделение

```typescript
// Добавляем компонент
const highlight = node.addComponent(SpriteHighlight);

// Выделяем спрайт
highlight.setHighlight();

// Убираем выделение
highlight.clearHighlight();
```

### Переключение выделения

```typescript
// При клике на спрайт
node.on(cc.Node.EventType.TOUCH_END, () => {
  const highlight = node.getComponent(SpriteHighlight);
  highlight.toggleHighlight();
});
```

### Множественное выделение

```typescript
// Выделяем несколько спрайтов
const sprites = [sprite1, sprite2, sprite3];
sprites.forEach((sprite) => {
  const highlight = sprite.getComponent(SpriteHighlight);
  highlight.setHighlight();
});

// Убираем все выделения
sprites.forEach((sprite) => {
  const highlight = sprite.getComponent(SpriteHighlight);
  highlight.clearHighlight();
});
```

### Динамическое изменение цвета

```typescript
const highlight = node.getComponent(SpriteHighlight);

// Разные цвета для разных состояний
highlight.setHighlightColor(cc.Color.GREEN); // Успех
highlight.setHighlightColor(cc.Color.RED); // Ошибка
highlight.setHighlightColor(cc.Color.BLUE); // Информация
```

## Особенности работы

### Сохранение оригинальных значений

Компонент автоматически сохраняет оригинальные цвет и прозрачность при инициализации:

```typescript
// При onLoad()
this.originalColor = this.node.color.clone();
this.originalOpacity = this.node.opacity;
```

### Восстановление значений

При снятии выделения восстанавливаются оригинальные значения:

```typescript
// При clearHighlight()
this.node.color = this.originalColor;
this.node.opacity = this.originalOpacity;
```

### Автоматическая очистка

При уничтожении компонента выделение автоматически снимается:

```typescript
onDestroy() {
  this.clearHighlight();
}
```

## Производительность

- ✅ **Минимальные затраты** - только изменение цвета ноды
- ✅ **Быстрое переключение** - мгновенное изменение состояния
- ✅ **Нет дополнительных нод** - не создает копий спрайтов
- ✅ **Оптимизированная память** - только сохранение оригинальных значений

## Ограничения

### ⚠️ Совместимость

- Работает только с компонентами `cc.Sprite`
- Не поддерживает `cc.Label` или другие компоненты

### ⚠️ Цветовой тинт

- Применяется ко всей ноде (включая все дочерние элементы)
- Может влиять на другие компоненты на той же ноде

### ⚠️ Прозрачность

- Изменяет прозрачность всей ноды
- Может влиять на дочерние элементы

## Отладка

### Проверка состояния

```typescript
// В консоли браузера
const highlight = node.getComponent(SpriteHighlight);
console.log("Is highlighted:", highlight.isHighlightedState());
console.log("Highlight color:", highlight.highlightColor);
console.log("Highlight opacity:", highlight.highlightOpacity);
```

### Принудительное обновление

```typescript
// Если спрайт изменился программно
highlight.updateOriginalValues();
highlight.resetToOriginal();
```
