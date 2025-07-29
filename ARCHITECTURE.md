# Architecture

<!-- Overview of the project architecture -->

## Data Layer

Below diagram illustrates relationships between main data classes.

```mermaid
classDiagram
    %% BoardConfig describes board size and colors
    class BoardConfig
    %% Board holds a matrix of Tiles and depends on BoardConfig
    class Board
    %% Tile represents a single board piece
    class Tile

    BoardConfig <.. Board : config
    Board "1" *-- "*" Tile : cells
```

The `BoardGenerator` class uses `BoardConfig` to create a `Board` filled
with `Tile` instances. It ensures the generated board always has at least one
possible move by regenerating up to ten times if necessary.
