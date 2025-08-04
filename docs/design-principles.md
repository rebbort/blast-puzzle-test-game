# Design Principles

This document summarises how the Blast Puzzle codebase aligns with common software design principles and highlights areas that could be improved.

## SOLID

### Single Responsibility
- `TurnManager` only tracks and broadcasts remaining turns, avoiding unrelated concerns.

### Open/Closed
- `ScoreStrategy` defines an interface for scoring algorithms; `ScoreStrategyQuadratic` is an implementation that can be swapped or extended without touching the client code.

### Liskov Substitution
- Any class implementing `ScoreStrategy` can be passed to components like `GameStateMachine` without breaking behaviour, enabling polymorphic substitution.

### Interface Segregation
- Interfaces such as `ScoreStrategy` are intentionally small, keeping components free from unused members.

### Dependency Inversion
- High‑level modules such as `GameStateMachine` receive their dependencies (board, solver, executor, scoring strategy and turn manager) via the constructor, allowing different implementations to be injected.

## KISS
- Methods like `Board.neighbors4` use straightforward data structures and loops to stay easy to read and maintain.
- `ScoreStrategyQuadratic` calculates its result with a single mathematical expression.

## DRY
- Event names are centralised in `EventNames`, preventing string duplication across the project.
- `InfrastructureEventBus` encapsulates common logic for subscribing, emitting and removing events, avoiding repeated boilerplate in individual modules.

## Design Patterns
- **Strategy** – `ScoreStrategy` and its implementations allow changing scoring logic without modifying consumers.
- **Observer** – `InfrastructureEventBus` follows the observer pattern, decoupling event producers from consumers and simplifying communication between UI and core logic.
- **State** – `GameStateMachine` implements a finite state machine, encapsulating game phases and making transitions explicit.
- **Command** – Board actions such as `RemoveCommand`, `FallCommand`, `FillCommand`, and `BombCommand` encapsulate operations, enabling composition and reuse.
- **Factory** – `TileFactory` and `SuperTileFactory` centralise creation of regular and super tiles, making it easier to introduce new types and configure random generation.

## Practical Extension Cases
### Adding a new super tile
1. Extend the `TileKind` enum with the new type.
2. Update `SuperTileFactory` to include creation logic and chance configuration for the new super tile.
3. Implement the effect, typically as a new `ICommand` or within `BoardSolver.expandBySupers`, and emit relevant events via the bus.

### Adding a new booster
1. Implement a booster class following the `Booster` interface.
2. Register it in `BoosterRegistry` so the HUD and `BoosterService` can expose it.
3. If the booster triggers board manipulation, encapsulate that behaviour in a command and reuse existing move execution flow.

### Introducing new tile types (e.g. teleporter)
1. Define a new `TileKind` and extend `TileFactory` to build it.
2. Expand board logic to store teleporter destinations and adjust `BoardSolver`/`MoveExecutor` so moves across teleports are handled.
3. Add corresponding visual effects and events so UI reacts consistently.

### Changing board shape (multiple fields with teleporters)
1. Extend `Board` or create a new board implementation describing two grids and teleport mappings.
2. Supply this board via dependency injection to `GameStateMachine` and other services; existing logic interacts through the same methods (`inBounds`, `neighbors4`, `tileAt`), so minimal changes are required.
3. Adjust `BoardGenerator` and path‑finding rules to respect the new layout.

## Areas for Improvement
- `GameStateMachine.onGroupSelected` is lengthy and mixes input handling, scoring and state transitions; splitting it into smaller functions would clarify responsibilities.
- `InfrastructureEventBus.emit` logs a warning for every emission with no listeners, which may be noisy in production; consider configurable logging.

