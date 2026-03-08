import { describe, expect, it } from '@rstest/core';

import { executeCheckContrast } from '../../src/tools/check-contrast.js';

describe('executeCheckContrast', () => {
  it('black/white → 21:1, all pass', () => {
    const r = executeCheckContrast({ foreground: '#000000', background: '#FFFFFF' });
    expect(r.contrastRatio).toBe(21);
    expect(r.foreground.hex).toBe('#000000');
    expect(r.background.hex).toBe('#ffffff');
    expect(r.results.wcag2_AA_normal.pass).toBe(true);
    expect(r.results.wcag2_AAA_normal.pass).toBe(true);
    expect(r.results.wcag2_AA_ui.pass).toBe(true);
  });

  it('white/white → 1:1, all fail', () => {
    const r = executeCheckContrast({ foreground: '#ffffff', background: '#ffffff' });
    expect(r.contrastRatio).toBe(1);
    expect(r.results.wcag2_AA_normal.pass).toBe(false);
  });

  it('#777777 on white → fails AA normal, passes AA large', () => {
    const r = executeCheckContrast({ foreground: '#777777', background: '#FFFFFF' });
    expect(r.contrastRatio).toBeCloseTo(4.48, 1);
    expect(r.results.wcag2_AA_normal.pass).toBe(false);
    expect(r.results.wcag2_AA_large.pass).toBe(true);
  });

  it('#767676 on white → passes AA normal (boundary case)', () => {
    const r = executeCheckContrast({ foreground: '#767676', background: '#FFFFFF' });
    expect(r.contrastRatio).toBe(4.54);
    expect(r.results.wcag2_AA_normal.pass).toBe(true);
  });

  it('#595959 on white → passes AAA normal (ratio = 7.0)', () => {
    const r = executeCheckContrast({ foreground: '#595959', background: '#FFFFFF' });
    expect(r.contrastRatio).toBe(7);
    expect(r.results.wcag2_AAA_normal.pass).toBe(true);
  });

  it('#FFFF00 on white → nearly invisible (ratio ≈ 1.07)', () => {
    const r = executeCheckContrast({ foreground: '#FFFF00', background: '#FFFFFF' });
    expect(r.contrastRatio).toBeCloseTo(1.07, 1);
    expect(r.results.wcag2_AA_normal.pass).toBe(false);
    expect(r.results.wcag2_AA_large.pass).toBe(false);
    expect(r.results.wcag2_AA_ui.pass).toBe(false);
  });

  it('accepts named CSS colors', () => {
    const r = executeCheckContrast({ foreground: 'navy', background: 'white' });
    expect(r.foreground.hex).toBe('#000080');
    expect(r.background.hex).toBe('#ffffff');
    expect(r.contrastRatio).toBeGreaterThan(10);
  });

  it('accepts rgb() notation', () => {
    const r = executeCheckContrast({
      foreground: 'rgb(255, 0, 0)',
      background: 'rgb(255, 255, 255)',
    });
    expect(r.foreground.hex).toBe('#ff0000');
    expect(r.contrastRatio).toBeCloseTo(4.0, 0);
  });

  it('accepts hsl() notation', () => {
    const r = executeCheckContrast({
      foreground: 'hsl(240, 100%, 50%)',
      background: '#FFFFFF',
    });
    expect(r.foreground.hex).toBe('#0000ff');
    expect(r.contrastRatio).toBe(8.59);
  });

  it('accepts 3-digit hex shorthand', () => {
    const r = executeCheckContrast({ foreground: '#000', background: '#FFF' });
    expect(r.contrastRatio).toBe(21);
  });

  it('fontSize 24px normal → textSize large', () => {
    const r = executeCheckContrast({
      foreground: '#777',
      background: '#FFF',
      fontSize: 24,
      fontWeight: 'normal',
    });
    expect(r.textSize).toBe('large');
  });

  it('fontSize 23px normal → textSize normal', () => {
    const r = executeCheckContrast({
      foreground: '#777',
      background: '#FFF',
      fontSize: 23,
      fontWeight: 'normal',
    });
    expect(r.textSize).toBe('normal');
  });

  it('fontSize 18.5px bold → textSize large', () => {
    const r = executeCheckContrast({
      foreground: '#777',
      background: '#FFF',
      fontSize: 18.5,
      fontWeight: 'bold',
    });
    expect(r.textSize).toBe('large');
  });

  it('fontSize 18px bold → textSize normal', () => {
    const r = executeCheckContrast({
      foreground: '#777',
      background: '#FFF',
      fontSize: 18,
      fontWeight: 'bold',
    });
    expect(r.textSize).toBe('normal');
  });

  it('no fontSize → textSize unknown', () => {
    const r = executeCheckContrast({ foreground: '#000', background: '#FFF' });
    expect(r.textSize).toContain('unknown');
  });

  it('required ratios are always correct', () => {
    const r = executeCheckContrast({ foreground: '#000', background: '#FFF' });
    expect(r.results.wcag2_AA_normal.required).toBe(4.5);
    expect(r.results.wcag2_AA_large.required).toBe(3);
    expect(r.results.wcag2_AAA_normal.required).toBe(7);
    expect(r.results.wcag2_AAA_large.required).toBe(4.5);
    expect(r.results.wcag2_AA_ui.required).toBe(3);
  });

  it('includes all WCAG threshold results', () => {
    const r = executeCheckContrast({ foreground: '#000000', background: '#ffffff' });
    expect(r.results).toHaveProperty('wcag2_AA_normal');
    expect(r.results).toHaveProperty('wcag2_AA_large');
    expect(r.results).toHaveProperty('wcag2_AAA_normal');
    expect(r.results).toHaveProperty('wcag2_AAA_large');
    expect(r.results).toHaveProperty('wcag2_AA_ui');
  });
});
