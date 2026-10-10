const EDGE = 5;
const GAP_X = 15;
const GAP_Y = 18;
const FLIP = 10;

type TooltipArea = {
  x: number;
  y: number;
  width: number;
  height: number;
  viewWidth: number;
  viewHeight: number;
};

function clamp(value: number, max: number): number {
  return Math.max(EDGE, Math.min(value, max));
}

export default function tooltipPosition({
  x,
  y,
  width,
  height,
  viewWidth,
  viewHeight,
}: TooltipArea): { left: number; top: number } {
  const fitsRight = x + GAP_X + width + EDGE <= viewWidth;
  return {
    left: clamp(fitsRight ? x + GAP_X : x - width - FLIP, viewWidth - width - EDGE),
    top: clamp(y + GAP_Y, viewHeight - height - EDGE),
  };
}
