import { describe, expect, it } from '@rstest/core';

import { executeAnalyzeDesignTokens } from '../../src/tools/analyze-design-tokens.js';

describe('executeAnalyzeDesignTokens — token classification', () => {
  const textPatterns = [
    'color-text-primary',
    'color-text-secondary',
    'color-fg-default',
    'color-foreground-muted',
    'color-heading',
    'color-label-primary',
    'color-link-default',
  ];

  for (const name of textPatterns) {
    it(`"${name}" → classified as text`, () => {
      const r = executeAnalyzeDesignTokens({
        tokens: {
          [name]: '#333333',
          'color-bg-default': '#FFFFFF',
        },
      });
      const textNames = r.tokens.filter((t) => t.role === 'text').map((t) => t.name);
      expect(textNames).toContain(name);
    });
  }

  const bgPatterns = [
    'theme-bg-primary',
    'theme-background-default',
    'theme-surface-default',
    'theme-canvas-default',
  ];

  for (const name of bgPatterns) {
    it(`"${name}" → classified as background`, () => {
      const r = executeAnalyzeDesignTokens({
        tokens: {
          'color-text-primary': '#000000',
          [name]: '#FFFFFF',
        },
      });
      const bgNames = r.tokens.filter((t) => t.role === 'background').map((t) => t.name);
      expect(bgNames).toContain(name);
    });
  }

  it('token matching both text and bg patterns → classified as ambiguous', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'color-bg-primary': '#336699',
        'pure-text-default': '#000',
        'pure-bg-default': '#FFF',
      },
    });
    const ambiguous = r.tokens.filter((t) => t.role === 'ambiguous').map((t) => t.name);
    expect(ambiguous).toContain('color-bg-primary');
  });

  it('no matching pattern at all → classified as ambiguous', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'theme-primary': '#FF0000',
        'theme-accent': '#00FF00',
      },
    });
    const ambiguous = r.tokens.filter((t) => t.role === 'ambiguous').map((t) => t.name);
    expect(ambiguous).toContain('theme-primary');
    expect(ambiguous).toContain('theme-accent');
  });
});

describe('executeAnalyzeDesignTokens — contrast analysis', () => {
  it('black text on white bg → all pairs pass', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'color-text-primary': '#000000',
        'color-bg-default': '#FFFFFF',
      },
    });
    expect(r.summary.passingPairs).toBeGreaterThan(0);
    expect(r.summary.failingPairs).toBe(0);
  });

  it('white text on white bg → all pairs fail', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'color-text-primary': '#FFFFFF',
        'color-bg-default': '#FFFFFF',
      },
    });
    expect(r.summary.failingPairs).toBeGreaterThan(0);
    expect(r.summary.passingPairs).toBe(0);
  });

  it('failing pair includes a suggestion', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'color-text-primary': '#AAAAAA',
        'color-bg-default': '#FFFFFF',
      },
    });
    expect(r.failures).toBeDefined();
    if (r.failures) {
      for (const f of r.failures) {
        expect(f.suggestion).toBeDefined();
      }
    }
  });

  it('self-pairing: same token for text + bg → same name skipped', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'color-text-primary': '#808080',
        'color-bg-default': '#808080',
      },
    });
    expect(r.summary.failingPairs).toBeGreaterThan(0);
  });

  it('AA, AAA, large, UI requirements all returned in allPairs', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'color-text-primary': '#000000',
        'color-bg-default': '#FFFFFF',
      },
    });
    const pair = r.allPairs[0];
    expect(pair).toBeDefined();
    expect(typeof pair.pass).toBe('boolean');
    expect(typeof pair.ratio).toBe('number');
    expect(typeof pair.required).toBe('number');
  });

  it('allPairs includes every text×bg combination', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'text-a': '#000',
        'text-b': '#333',
        'bg-a': '#FFF',
        'bg-b': '#EEE',
      },
    });
    expect(r.allPairs.length).toBe(4);
  });

  it('passing + failing = total pairs', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'color-text-primary': '#333',
        'color-text-secondary': '#999',
        'color-bg-default': '#FFF',
        'color-bg-surface': '#F0F0F0',
      },
    });
    expect(r.summary.passingPairs + r.summary.failingPairs).toBe(r.summary.totalPairs);
  });
});

describe('executeAnalyzeDesignTokens — custom patterns', () => {
  it('custom textTokenPatterns override defaults', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'my-txt-color': '#000',
        'color-bg-default': '#FFF',
      },
      textTokenPatterns: ['txt'],
    });
    const textNames = r.tokens.filter((t) => t.role === 'text').map((t) => t.name);
    expect(textNames).toContain('my-txt-color');
  });

  it('custom backgroundTokenPatterns override defaults', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'text-primary': '#000',
        'my-bkg-main': '#FFF',
      },
      backgroundTokenPatterns: ['bkg'],
    });
    const bgNames = r.tokens.filter((t) => t.role === 'background').map((t) => t.name);
    expect(bgNames).toContain('my-bkg-main');
  });
});

describe('executeAnalyzeDesignTokens — defaults', () => {
  it('default level is AA, textSize normal (required = 4.5)', () => {
    const r = executeAnalyzeDesignTokens({
      tokens: {
        'color-text-primary': '#777777',
        'color-bg-default': '#FFFFFF',
      },
    });
    expect(r.summary.level).toBe('AA');
    expect(r.summary.textSize).toBe('normal');
    expect(r.summary.required).toBe(4.5);
  });
});
