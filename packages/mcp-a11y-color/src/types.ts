/**
 * Shared types for @weAAAre/mcp-a11y-color
 */

export interface RGBColor {
  r: number; // 0–255
  g: number; // 0–255
  b: number; // 0–255
}

export interface HSLColor {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

export interface OklchColor {
  l: number; // 0–1
  c: number; // 0–0.4+
  h: number; // 0–360
}

export interface ColorInfo {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  relativeLuminance: number;
  isLight: boolean;
}

export interface ContrastResult {
  ratio: number;
  level: {
    AA_normal: boolean;
    AA_large: boolean;
    AAA_normal: boolean;
    AAA_large: boolean;
    AA_ui: boolean;
  };
}

export type ColorBlindnessType =
  | 'protanopia'
  | 'protanomaly'
  | 'deuteranopia'
  | 'deuteranomaly'
  | 'tritanopia'
  | 'tritanomaly'
  | 'achromatopsia'
  | 'achromatomaly';

export const COLOR_BLINDNESS_TYPES: ColorBlindnessType[] = [
  'protanopia',
  'protanomaly',
  'deuteranopia',
  'deuteranomaly',
  'tritanopia',
  'tritanomaly',
  'achromatopsia',
  'achromatomaly',
];
