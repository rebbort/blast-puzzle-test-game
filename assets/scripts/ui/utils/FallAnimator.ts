export function runFallAnimation(
  node: cc.Node,
  end: cc.Vec2,
  delay: number = 0,
  onComplete?: () => void,
): void {
  const dist = Math.abs(node.y - end.y);
  const dur = dist / 1400;
  const maybe = node as unknown as { stopAllActions?: () => void };
  if (typeof maybe.stopAllActions === "function") maybe.stopAllActions();
  const actions: unknown[] = [];
  if (delay > 0) actions.push(cc.delayTime(delay));
  actions.push(cc.moveTo(dur, end.x, end.y));
  actions.push(
    cc.callFunc(() => {
      const bump = cc.sequence(
        cc.scaleTo(0.5, 0.5, 0.5),
        cc.scaleTo(0.5, 1, 1),
      );
      node.runAction(bump);
    }),
  );
  if (onComplete) {
    actions.push(cc.callFunc(onComplete));
  }
  // cc.sequence expects variadic arguments but TypeScript complains when
  // spreading an array of `any`. Use apply to avoid the tuple requirement.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node.runAction((cc.sequence as any).apply(cc, actions));
}
