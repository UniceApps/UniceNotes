type Rgb = [r: number, g: number, b: number];

// "#00629f" ou "rgb(0, 98, 159)"
function parseRgb(color: string): Rgb | null {
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  const rgb = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

function toHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

// "rgb(0, 98, 159)" -> "#00629f", pour les widgets et la Live Activity
export function hexColor(color: string): string {
  const rgb = parseRgb(color);
  return rgb ? toHex(rgb) : color;
}

// "rgb(0, 98, 159)" -> "rgba(0, 98, 159, 0.12)"
export function withAlpha(color: string, alpha: number): string {
  const rgb = parseRgb(color);
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : color;
}

// même nombre pour un même texte
export function hashString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}
