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

// "rgb(0, 98, 159)" -> "rgba(0, 98, 159, 0.12)"
export function withAlpha(color: string, alpha: number): string {
  const rgb = parseRgb(color);
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : color;
}

// texte lisible (sombre ou blanc) sur un fond de cette couleur
export function readableOn(color: string): string {
  const rgb = parseRgb(color);
  if (!rgb) return '#1B1B1F';
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#1B1B1F' : '#FFFFFF';
}

// couleur stable d'un cours d'après son nom, éclaircie de 25 % vers le blanc
export function colorFromString(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const channels = [0, 1, 2].map((i) => (hash >> (i * 8)) & 0xff);
  return toHex(channels.map((c) => Math.round(Math.sqrt(0.75 * c * c + 0.25 * 255 * 255))) as Rgb);
}
