import type { ColorBlindnessType, RGBColor } from '../types.js';

const CVD_MATRICES: Record<ColorBlindnessType, number[][]> = {
  protanopia: [
    [0.567, 0.433, 0.0],
    [0.558, 0.442, 0.0],
    [0.0, 0.242, 0.758],
  ],
  deuteranopia: [
    [0.625, 0.375, 0.0],
    [0.7, 0.3, 0.0],
    [0.0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0.0],
    [0.0, 0.433, 0.567],
    [0.0, 0.475, 0.525],
  ],

  protanomaly: [
    [0.817, 0.183, 0.0],
    [0.333, 0.667, 0.0],
    [0.0, 0.125, 0.875],
  ],
  deuteranomaly: [
    [0.8, 0.2, 0.0],
    [0.258, 0.742, 0.0],
    [0.0, 0.142, 0.858],
  ],
  tritanomaly: [
    [0.967, 0.033, 0.0],
    [0.0, 0.733, 0.267],
    [0.0, 0.183, 0.817],
  ],

  achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
  ],
  achromatomaly: [
    [0.618, 0.32, 0.062],
    [0.163, 0.775, 0.062],
    [0.163, 0.32, 0.516],
  ],
};

const srgbToLinear = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const linearToSrgb = (c: number): number => {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(255, Math.max(0, s * 255)));
};

const applyMatrix = (
  matrix: number[][],
  r: number,
  g: number,
  b: number,
): [number, number, number] => [
  matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b,
  matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b,
  matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b,
];

export const simulateColorBlindness = (color: RGBColor, type: ColorBlindnessType): RGBColor => {
  const matrix = CVD_MATRICES[type];
  const lr = srgbToLinear(color.r);
  const lg = srgbToLinear(color.g);
  const lb = srgbToLinear(color.b);
  const [sr, sg, sb] = applyMatrix(matrix, lr, lg, lb);

  return {
    r: linearToSrgb(sr),
    g: linearToSrgb(sg),
    b: linearToSrgb(sb),
  };
};

export const simulateAllTypes = (color: RGBColor): Record<ColorBlindnessType, RGBColor> => {
  const result = {} as Record<ColorBlindnessType, RGBColor>;
  for (const type of Object.keys(CVD_MATRICES) as ColorBlindnessType[]) {
    result[type] = simulateColorBlindness(color, type);
  }
  return result;
};

export const deltaE = (color1: RGBColor, color2: RGBColor): number => {
  const lab1 = rgbToLabApprox(color1);
  const lab2 = rgbToLabApprox(color2);

  return Math.sqrt((lab1.l - lab2.l) ** 2 + (lab1.a - lab2.a) ** 2 + (lab1.b - lab2.b) ** 2);
};

const rgbToLabApprox = (color: RGBColor): { l: number; a: number; b: number } => {
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);

  let x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  let y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  let z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;

  x /= 0.95047;
  y /= 1.0;
  z /= 1.08883;

  const epsilon = 0.008856;
  const kappa = 903.3;

  const fx = x > epsilon ? x ** (1 / 3) : (kappa * x + 16) / 116;
  const fy = y > epsilon ? y ** (1 / 3) : (kappa * y + 16) / 116;
  const fz = z > epsilon ? z ** (1 / 3) : (kappa * z + 16) / 116;

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
};
