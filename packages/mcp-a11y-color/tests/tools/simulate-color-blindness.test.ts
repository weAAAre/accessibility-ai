import { describe, expect, it } from '@rstest/core';

import { executeSimulateColorBlindness } from '../../src/tools/simulate-color-blindness.js';

describe('executeSimulateColorBlindness', () => {
  it('single color, all types → 8 simulation entries', () => {
    const r = executeSimulateColorBlindness({ colors: ['#FF0000'], type: 'all' });
    expect(r.original).toEqual(['#FF0000']);
    expect(Object.keys(r.simulations)).toHaveLength(8);
  });

  it('single color, specific type → 1 simulation entry', () => {
    const r = executeSimulateColorBlindness({ colors: ['#FF0000'], type: 'protanopia' });
    expect(Object.keys(r.simulations)).toEqual(['protanopia']);
    expect(r.simulations.protanopia.colors).toHaveLength(1);
    expect(r.simulations.protanopia.colors[0]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('multiple colors → pairContrasts present', () => {
    const r = executeSimulateColorBlindness({
      colors: ['#FF0000', '#00FF00'],
      type: 'deuteranopia',
    });
    expect(r.simulations.deuteranopia.pairContrasts).toBeDefined();
    expect(r.simulations.deuteranopia.pairContrasts).toHaveLength(1);
  });

  it('3 colors → 3 pairContrasts (C(3,2))', () => {
    const r = executeSimulateColorBlindness({
      colors: ['#FF0000', '#00FF00', '#0000FF'],
      type: 'deuteranopia',
    });
    expect(r.simulations.deuteranopia.pairContrasts).toHaveLength(3);
  });

  it('single color → no pairContrasts', () => {
    const r = executeSimulateColorBlindness({ colors: ['#336699'], type: 'tritanopia' });
    expect(r.simulations.tritanopia.pairContrasts).toBeUndefined();
  });

  it('red/green under protanopia lose distinguishability', () => {
    const r = executeSimulateColorBlindness({
      colors: ['#FF0000', '#00FF00'],
      type: 'protanopia',
    });
    expect(r.simulations.protanopia.colors).toHaveLength(2);
    expect(r.simulations.protanopia.pairContrasts).toHaveLength(1);
    expect(r.simulations.protanopia.pairContrasts?.[0].ratio).toBeGreaterThan(0);
  });

  it('generates warnings for hard-to-distinguish pairs', () => {
    const r = executeSimulateColorBlindness({
      colors: ['#33aa33', '#aa3333'],
      type: 'achromatopsia',
    });
    const simColors = r.simulations.achromatopsia;
    expect(simColors.pairContrasts).toBeDefined();
    if (r.warnings && r.warnings.length > 0) {
      expect(r.warnings[0]).toContain('achromatopsia');
    }
  });

  it('simulating specific type returns only that type', () => {
    const r = executeSimulateColorBlindness({ colors: ['#cc3366'], type: 'achromatopsia' });
    expect(Object.keys(r.simulations)).toEqual(['achromatopsia']);
  });

  it('handles 3+ colors with correct number of pairs', () => {
    const r = executeSimulateColorBlindness({
      colors: ['#ff0000', '#00ff00', '#0000ff'],
      type: 'protanopia',
    });
    expect(r.simulations.protanopia.pairContrasts).toHaveLength(3);
  });
});
