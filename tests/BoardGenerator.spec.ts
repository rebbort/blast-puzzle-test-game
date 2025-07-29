import { BoardGenerator } from '../assets/scripts/core/board/BoardGenerator';
import { Vec2 } from 'cc';
import { BoardConfig } from '../assets/scripts/config/BoardConfig';

describe('BoardGenerator', () => {
  const cfg: BoardConfig = {
    cols: 4,
    rows: 4,
    tileSize: 1,
    colors: ['red', 'blue'],
    superThreshold: 3,
  };
  const gen = new BoardGenerator();

  test('generated board has correct size and no dead start', () => {
    const board = gen.generate(cfg);
    // check dimensions
    expect(board.inBounds(new Vec2(cfg.cols - 1, cfg.rows - 1))).toBe(true);
    expect(board.inBounds(new Vec2(cfg.cols, cfg.rows - 1))).toBe(false);

    // ensure at least one adjacent pair of same color exists
    let hasMove = false;
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        const p = new Vec2(x, y);
        const tile = board.tileAt(p);
        if (!tile) continue;
        for (const n of board.neighbors4(p)) {
          const other = board.tileAt(n);
          if (other && other.color === tile.color) {
            hasMove = true;
            break;
          }
        }
        if (hasMove) break;
      }
      if (hasMove) break;
    }
    expect(hasMove).toBe(true);
  });
});
