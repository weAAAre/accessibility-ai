/**
 * Color blindness simulation using Brettel, Viénot & Mollon (1997) and
 * Machado, Oliveira & Fernandes (2009) color vision deficiency simulation matrices.
 *
 * These transformation matrices are derived from published academic research
 * and are in the public domain.
 */

import type { ColorBlindnessType, RGBColor } from '../types.js';

/**
 * Simulation matrices for each type of color vision deficiency.
 * Applied in linear RGB space (after gamma decoding).
 *
 * Each matrix is a 3x3 transformation: [R', G', B'] = M × [R, G, B]
 */
const CVD_MATRICES: Record<ColorBlindnessType, number[][]> = {
  // Dichromats (complete absence)
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

  // Anomalous trichromats (reduced sensitivity) — interpolated at ~0.6 severity
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

  // Monochromats
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

/**
 * Convert sRGB component (0–255) to linear RGB.
 */
function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/**
 * Convert linear RGB component to sRGB (0–255).
 */
function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(255, Math.max(0, s * 255)));
}

/**
 * Apply a 3x3 matrix transformation to a linear RGB triplet.
 */
function applyMatrix(
  matrix: number[][],
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  return [
    matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b,
    matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b,
    matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b,
  ];
}

/**
 * Simulate how a color appears to someone with a specific type of color blindness.
 */
export function simulateColorBlindness(color: RGBColor, type: ColorBlindnessType): RGBColor {
  const matrix = CVD_MATRICES[type];

  // Convert to linear RGB
  const lr = srgbToLinear(color.r);
  const lg = srgbToLinear(color.g);
  const lb = srgbToLinear(color.b);

  // Apply CVD transformation
  const [sr, sg, sb] = applyMatrix(matrix, lr, lg, lb);

  // Convert back to sRGB
  return {
    r: linearToSrgb(sr),
    g: linearToSrgb(sg),
    b: linearToSrgb(sb),
  };
}

/**
 * Simulate a color under all 8 CVD types.
 */
export function simulateAllTypes(color: RGBColor): Record<ColorBlindnessType, RGBColor> {
  const result = {} as Record<ColorBlindnessType, RGBColor>;
  for (const type of Object.keys(CVD_MATRICES) as ColorBlindnessType[]) {
    result[type] = simulateColorBlindness(color, type);
  }
  return result;
}

/**
 * Calculate CIE76 Delta E (color difference) between two colors.
 * Uses a simplified Lab conversion for efficiency.
 * Values < 1: not perceptible, 1–2: close observation, 2–10: perceivable at a glance,
 * 11–49: more similar than opposite, > 100: exact opposite.
 */
export function deltaE(color1: RGBColor, color2: RGBColor): number {
  const lab1 = rgbToLabApprox(color1);
  const lab2 = rgbToLabApprox(color2);

  return Math.sqrt((lab1.l - lab2.l) ** 2 + (lab1.a - lab2.a) ** 2 + (lab1.b - lab2.b) ** 2);
}

/**
 * Approximate RGB to CIE Lab conversion.
 */
function rgbToLabApprox(color: RGBColor): { l: number; a: number; b: number } {
  // sRGB to linear
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);

  // Linear RGB to XYZ (D65)
  let x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  let y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  let z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;

  // Normalize to D65 white point
  x /= 0.95047;
  y /= 1.0;
  z /= 1.08883;

  // XYZ to Lab
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
}
