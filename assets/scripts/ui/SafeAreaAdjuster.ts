const { ccclass } = cc._decorator;

declare const screen: {
  safeArea: { x: number; y: number; width: number; height: number };
};

interface Adjustable {
  paddingLeft: number;
  paddingRight: number;
  paddingBottom: number;
  paddingTop: number;
}

interface NodeWithUITransform {
  getComponent(name: string): Adjustable | null;
}

/**
 * Adjusts the padding of the attached UI node to match the device safe area.
 * This ensures that on devices with notches or rounded corners the HUD
 * elements remain fully visible.
 *
 * Canvas automatically scales to 540x960 while preserving aspect ratio using
 * the Fit Width & Fit Height settings defined in the scene files. The safe
 * area offsets are then applied here at runtime so UI widgets avoid cutouts
 * on phones like iPhone X.
 */
@ccclass("")
export class SafeAreaAdjuster extends cc.Component {
  /** Reads screen.safeArea and applies it to the node's UITransform. */
  start(): void {
    const area = screen.safeArea;
    const node = this.node as unknown as NodeWithUITransform;
    const uiTransform = node.getComponent("UITransform");
    if (!uiTransform || !area) return;

    uiTransform.paddingLeft = area.x;
    uiTransform.paddingRight = area.width - area.x;
    uiTransform.paddingBottom = area.y;
    uiTransform.paddingTop = area.height - area.y;
  }
}
