interface ColorComponents {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(d: string): ColorComponents | null {
  const n = d.length;
  let r: number, g: number, b: number, a: number;

  if (n > 9) {
    const parts = d.split(',');
    if (parts.length < 3 || parts.length > 4) return null;
    r = parseInt(parts[0][3] === 'a' ? parts[0].slice(5) : parts[0].slice(4));
    g = parseInt(parts[1]);
    b = parseInt(parts[2]);
    a = parts[3] ? parseFloat(parts[3]) : -1;
  } else {
    if (n === 8 || n === 6 || n < 4) return null;
    let hex = d;
    if (n < 6)
      hex =
        '#' +
        d[1] +
        d[1] +
        d[2] +
        d[2] +
        d[3] +
        d[3] +
        (n > 4 ? d[4] + d[4] : '');
    const num = parseInt(hex.slice(1), 16);
    if (n === 9 || n === 5) {
      r = (num >> 24) & 255;
      g = (num >> 16) & 255;
      b = (num >> 8) & 255;
      a = Math.round((num & 255) / 0.255) / 1000;
    } else {
      r = num >> 16;
      g = (num >> 8) & 255;
      b = num & 255;
      a = -1;
    }
  }
  return { r, g, b, a };
}

export function pSBC(
  p: number,
  c0: string,
  c1?: string,
  l?: boolean,
): string | null {
  if (
    typeof p !== 'number' ||
    p < -1 ||
    p > 1 ||
    typeof c0 !== 'string' ||
    (c0[0] !== 'r' && c0[0] !== '#') ||
    (c1 && typeof c1 !== 'string')
  )
    return null;

  const isHex = c0.length > 9;
  const useHex = c1
    ? c1.length > 9
      ? true
      : c1 === 'c'
        ? !isHex
        : false
    : isHex;
  const f = parseColor(c0);
  const P = p < 0;
  const t =
    c1 && c1 !== 'c'
      ? parseColor(c1)
      : P
        ? { r: 0, g: 0, b: 0, a: -1 }
        : { r: 255, g: 255, b: 255, a: -1 };
  const pAbs = P ? -p : p;
  const P1 = 1 - pAbs;

  if (!f || !t) return null;

  let r: number, g: number, b: number;
  if (l) {
    r = Math.round(P1 * f.r + pAbs * t.r);
    g = Math.round(P1 * f.g + pAbs * t.g);
    b = Math.round(P1 * f.b + pAbs * t.b);
  } else {
    r = Math.round(Math.pow(P1 * Math.pow(f.r, 2) + pAbs * Math.pow(t.r, 2), 0.5));
    g = Math.round(Math.pow(P1 * Math.pow(f.g, 2) + pAbs * Math.pow(t.g, 2), 0.5));
    b = Math.round(Math.pow(P1 * Math.pow(f.b, 2) + pAbs * Math.pow(t.b, 2), 0.5));
  }

  const fa = f.a;
  const ta = t.a;
  const hasAlpha = fa >= 0 || ta >= 0;
  const a = hasAlpha
    ? fa < 0
      ? ta
      : ta < 0
        ? fa
        : fa * P1 + ta * pAbs
    : 0;

  if (useHex) {
    return `rgb${hasAlpha ? 'a' : ''}(${r},${g},${b}${hasAlpha ? ',' + Math.round(a * 1000) / 1000 : ''})`;
  }
  return (
    '#' +
    (
      4294967296 +
      r * 16777216 +
      g * 65536 +
      b * 256 +
      (hasAlpha ? Math.round(a * 255) : 0)
    )
      .toString(16)
      .slice(1, hasAlpha ? undefined : -2)
  );
}

export function stringToColour(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += ('00' + value.toString(16)).slice(-2);
  }
  return pSBC(0.25, colour) ?? colour;
}
