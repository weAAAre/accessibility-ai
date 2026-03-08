export type RGBColor = {
  r: number;
  g: number;
  b: number;
};

export type HSLColor = {
  h: number;
  s: number;
  l: number;
};

export type ColorInfo = {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  relativeLuminance: number;
  isLight: boolean;
};

export type ContrastResult = {
  ratio: number;
  level: {
    AA_normal: boolean;
    AA_large: boolean;
    AAA_normal: boolean;
    AAA_large: boolean;
    AA_ui: boolean;
  };
};

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
