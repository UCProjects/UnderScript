export default function place({ x, y }, { width, height }, viewport, gap = 8) {
  const clamp = (value, size, limit) => Math.max(gap, Math.min(value, limit - size - gap));
  return {
    left: clamp(x, width, viewport.width),
    top: clamp(y, height, viewport.height),
  };
}
