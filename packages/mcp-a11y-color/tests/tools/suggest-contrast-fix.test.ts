import { describe, expect, it } from '@rstest/core';

import { executeSuggestContrastFix } from '../../src/tools/suggest-contrast-fix.js';

describe('executeSuggestContrastFix', () => {
  it('already passing returns status already_passing', () => {
    const r = executeSuggestContrastFix({
      foreground: '#000000',
      background: '#FFFFFF',
      level: 'AA',
      textSize: 'normal',
    });
    expect(r.status).toBe('already_passing');
    expect(r.original.ratio).toBe(21);
    expect(r.target.required).toBe(4.5);
  });

  it('already passing AAA', () => {
    const r = executeSuggestContrastFix({
      foreground: '#000000',
      background: '#FFFFFF',
      level: 'AAA',
      textSize: 'normal',
    });
    expect(r.status).toBe('already_passing');
  });

  it('#777777 on white → fixed with suggestion that passes AA', () => {
    const r = executeSuggestContrastFix({
      foreground: '#777777',
      background: '#FFFFFF',
      level: 'AA',
      textSize: 'normal',
    });
    expect(r.status).toBe('fixed');
    if (r.status === 'fixed') {
      expect(r.suggested.ratio).toBeGreaterThanOrEqual(4.5);
      expect(r.suggested.foreground).toBe('#767676');
      expect(r.deltaE).toBeGreaterThan(0);
    }
  });

  it('#FF0000 on white → fixed to meet AA normal', () => {
    const r = executeSuggestContrastFix({
      foreground: '#FF0000',
      background: '#FFFFFF',
      level: 'AA',
      textSize: 'normal',
    });
    expect(r.status).toBe('fixed');
    if (r.status === 'fixed') {
      expect(r.suggested.ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('#767676 on white → fixed to meet AAA normal (7:1)', () => {
    const r = executeSuggestContrastFix({
      foreground: '#767676',
      background: '#FFFFFF',
      level: 'AAA',
      textSize: 'normal',
    });
    expect(r.status).toBe('fixed');
    if (r.status === 'fixed') {
      expect(r.suggested.ratio).toBeGreaterThanOrEqual(7);
    }
  });

  it('#999999 on white → suggested fix for AA large (3:1)', () => {
    const r = executeSuggestContrastFix({
      foreground: '#999999',
      background: '#FFFFFF',
      level: 'AA',
      textSize: 'large',
    });
    if (r.status === 'fixed') {
      expect(r.suggested.ratio).toBeGreaterThanOrEqual(3);
    }
  });

  it('#AAAAAA on white → fix for UI components (3:1)', () => {
    const r = executeSuggestContrastFix({
      foreground: '#AAAAAA',
      background: '#FFFFFF',
      level: 'AA',
      textSize: 'ui',
    });
    if (r.status === 'fixed') {
      expect(r.suggested.ratio).toBeGreaterThanOrEqual(3);
    }
  });

  it('response always includes original and target', () => {
    const r = executeSuggestContrastFix({
      foreground: '#999',
      background: '#FFF',
      level: 'AA',
      textSize: 'normal',
    });
    expect(r.original).toBeDefined();
    expect(r.original.foreground).toBeDefined();
    expect(r.original.background).toBeDefined();
    expect(r.original.ratio).toBeGreaterThan(0);
    expect(r.target).toBeDefined();
    expect(r.target.level).toBe('AA');
    expect(r.target.textSize).toBe('normal');
    expect(r.target.required).toBe(4.5);
  });

  it('fixed response includes deltaE', () => {
    const r = executeSuggestContrastFix({
      foreground: '#999',
      background: '#FFF',
      level: 'AA',
      textSize: 'normal',
    });
    if (r.status === 'fixed') {
      expect(typeof r.deltaE).toBe('number');
      expect(r.deltaE).toBeGreaterThan(0);
    }
  });
});
