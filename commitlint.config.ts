import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Scopes allowed in this monorepo
    'scope-enum': [
      2,
      'always',
      [
        // packages
        'mcp-a11y-color',
        'mcp-auditor-core',
        'mcp-virtual-screen-reader-auditor',
        'mcp-voiceover-auditor',
        // skills
        'skills',
        'aria-patterns',
        // monorepo layers
        'packages',
        'root',
        'ci',
        'deps',
        'release',
      ],
    ],
    // Keep subject short and impersonal
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};

export default config;
