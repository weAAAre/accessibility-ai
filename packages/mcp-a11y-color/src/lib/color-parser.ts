import { hsla, parseToRgba, rgba, toHex, toHsla } from 'color2k';

import type { ColorInfo, HSLColor, RGBColor } from '../types.js';

export const parseColor = (color: string): RGBColor => {
  const [r, g, b] = parseToRgba(color);
  return { r, g, b };
};

export const parseColorWithAlpha = (color: string): RGBColor & { a: number } => {
  const [r, g, b, a] = parseToRgba(color);
  return { r, g, b, a };
};

export const rgbToHex = (color: RGBColor): string => toHex(rgba(color.r, color.g, color.b, 1));

export const rgbToHsl = (color: RGBColor): HSLColor => {
  const result = toHsla(rgba(color.r, color.g, color.b, 1));
  const match = result.match(/hsla?\(([^,]+),\s*([^,]+)%?,\s*([^,]+)%?/);
  if (match) {
    return {
      h: Math.round(Number.parseFloat(match[1])),
      s: Math.round(Number.parseFloat(match[2])),
      l: Math.round(Number.parseFloat(match[3])),
    };
  }
  return rgbToHslManual(color);
};

const rgbToHslManual = (color: RGBColor): HSLColor => {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hslToRgb = (color: HSLColor): RGBColor => {
  const result = hsla(color.h, color.s / 100, color.l / 100, 1);
  return parseColor(result);
};

export const getColorInfo = (color: string): ColorInfo => {
  const rgb = parseColor(color);
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const luminance = relativeLuminance(rgb);

  const perceivedBrightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 255000;

  return {
    hex,
    rgb,
    hsl,
    relativeLuminance: luminance,
    isLight: perceivedBrightness > 0.5,
  };
};

/**
 * @see https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export const relativeLuminance = (color: RGBColor): number => {
  const [rs, gs, bs] = [color.r / 255, color.g / 255, color.b / 255];
  const r = rs <= 0.04045 ? rs / 12.92 : ((rs + 0.055) / 1.055) ** 2.4;
  const g = gs <= 0.04045 ? gs / 12.92 : ((gs + 0.055) / 1.055) ** 2.4;
  const b = bs <= 0.04045 ? bs / 12.92 : ((bs + 0.055) / 1.055) ** 2.4;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const alphaBlend = (fg: RGBColor & { a: number }, bg: RGBColor): RGBColor => ({
  r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
  g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
  b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
});
