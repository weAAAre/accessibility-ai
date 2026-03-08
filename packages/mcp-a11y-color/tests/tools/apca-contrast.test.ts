import { describe, expect, it } from '@rstest/core';

import { executeApcaContrast } from '../../src/tools/apca-contrast.js';

describe('executeApcaContrast', () => {
  it('returns expected structure for black on white', () => {
    const r = executeApcaContrast({ textColor: '#000000', backgroundColor: '#FFFFFF' });
    expect(r.textColor.hex).toBe('#000000');
    expect(r.backgroundColor.hex).toBe('#ffffff');
    expect(r.apca.lc).toBeGreaterThan(100);
    expect(r.apca.polarity).toBe('dark-on-light');
    expect(r.apca.recommendation).toContain('body text');
    expect(r.wcag2.ratio).toBe(21);
  });

  it('light-on-dark produces negative Lc and correct polarity', () => {
    const r = executeApcaContrast({ textColor: '#FFFFFF', backgroundColor: '#000000' });
    expect(r.apca.lc).toBeLessThan(-100);
    expect(r.apca.polarity).toBe('light-on-dark');
  });

  it('identical colors → Lc 0, polarity none', () => {
    const r = executeApcaContrast({ textColor: '#808080', backgroundColor: '#808080' });
    expect(r.apca.lc).toBe(0);
    expect(r.apca.polarity).toBe('none');
  });

  it('#888888 on white → Lc = 63.1', () => {
    const r = executeApcaContrast({ textColor: '#888888', backgroundColor: '#FFFFFF' });
    expect(r.apca.lc).toBe(63.1);
  });

  it('includes WCAG 2.x contrast ratio', () => {
    const r = executeApcaContrast({ textColor: '#333333', backgroundColor: '#FFFFFF' });
    expect(r.wcag2.ratio).toBeGreaterThan(10);
    expect(typeof r.wcag2.ratio).toBe('number');
  });

  it('accepts named CSS colors', () => {
    const r = executeApcaContrast({ textColor: 'red', backgroundColor: 'white' });
    expect(r.textColor.hex).toBe('#ff0000');
    expect(r.backgroundColor.hex).toBe('#ffffff');
    expect(r.apca.lc).toBeGreaterThan(0);
  });

  it('accepts rgb() syntax', () => {
    const r = executeApcaContrast({
      textColor: 'rgb(0, 0, 255)',
      backgroundColor: 'rgb(255, 255, 255)',
    });
    expect(r.textColor.hex).toBe('#0000ff');
    expect(r.apca.lc).toBeGreaterThan(80);
  });

  const chromatic: [string, string, string, number, number][] = [
    ['navy on white', 'navy', '#FFFFFF', 80, 110],
    ['maroon on white', 'maroon', '#FFFFFF', 70, 100],
    ['teal on white', 'teal', '#FFFFFF', 55, 80],
    ['olive on white', 'olive', '#FFFFFF', 50, 80],
    ['purple on white', 'purple', '#FFFFFF', 80, 110],
  ];

  for (const [desc, text, bg, lo, hi] of chromatic) {
    it(`chromatic: ${desc} → Lc in [${lo}, ${hi}]`, () => {
      const r = executeApcaContrast({ textColor: text, backgroundColor: bg });
      expect(r.apca.lc).toBeGreaterThanOrEqual(lo);
      expect(r.apca.lc).toBeLessThanOrEqual(hi);
    });
  }
});
