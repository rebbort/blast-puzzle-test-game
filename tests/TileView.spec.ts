import TileView from "../assets/scripts/ui/views/TileView";
import { TileFactory, TileKind } from "../assets/scripts/core/board/Tile";
import { TileAppearanceConfig } from "../assets/scripts/core/board/TileAppearanceConfig";

describe("TileView", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spawnPrefab = new (cc.Prefab as any)("spawn", TileAppearanceConfig);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activatePrefab = new (cc.Prefab as any)(
    "activate",
    TileAppearanceConfig,
  );

  class NormalVisual extends TileAppearanceConfig {
    constructor() {
      super();
      this.kind = TileKind.Normal;
      this.spawnFx = spawnPrefab;
    }
  }

  class RowVisual extends TileAppearanceConfig {
    constructor() {
      super();
      this.kind = TileKind.SuperRow;
      this.activateFx = activatePrefab;
    }
  }

  test("apply swaps visuals and triggers fx", () => {
    const root = new cc.Node();
    const viewNode = new cc.Node();
    viewNode.parent = root;
    const view = viewNode.addComponent(TileView);
    view.visualRoot = new cc.Node();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalPrefab = new (cc.Prefab as any)("normal", NormalVisual);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const superPrefab = new (cc.Prefab as any)("row", RowVisual);

    view.normalVariants = [normalPrefab];
    view.superVariants = [];
    view.superVariants[TileKind.SuperRow] = superPrefab;

    const spy = jest.spyOn(cc, "instantiate");

    const tile = TileFactory.createNormal("red");
    view.apply(tile);
    expect(spy.mock.calls[0][0]).toBe(normalPrefab);
    expect(spy.mock.calls[1][0]).toBe(spawnPrefab);

    tile.kind = TileKind.SuperRow;
    view.apply(tile);
    expect(spy.mock.calls[2][0]).toBe(superPrefab);

    const fxNode = new cc.Node();
    spy.mockImplementation(() => fxNode);

    view.activateSuper();
    expect(spy.mock.calls[3][0]).toBe(activatePrefab);
    expect(fxNode.parent).toBe(root);
  });
});
