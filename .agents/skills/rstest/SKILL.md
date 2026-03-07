---
name: rstest
description:
  Expert guidance for writing, configuring, and running tests with Rstest — the Rspack-powered. JavaScript/TypeScript testing framework with Jest-compatible APIs and native ESM/TypeScript support. Covers setup, configuration (rstest.config.ts), mocking (rs.mock, rstest.fn, rstest.spyOn), fake timers, snapshots, DOM testing (jsdom/happy-dom), Browser Mode (Playwright), React/Vue component testing, code coverage (istanbul), multi-project testing, in-source tests, and integration with Rsbuild/Rslib via official adapters (@rstest/adapter-rsbuild, @rstest/adapter-rslib). Use this skill whenever the user mentions "rstest", "@rstest/core", is writing or debugging tests in an Rspack/Rsbuild/Rslib project, migrating from Jest or Vitest to Rstest, or needs help with any testing workflow that involves the Rstack ecosystem. Also trigger when the user asks about mocking with rs.mock, configuring test environments, or setting up browser-based testing with @rstest/browser.
license: MIT
metadata:
  author: weAAAre
  version: 0.2.0
---

# Rstest

Rstest is a testing framework powered by Rspack. It provides Jest-compatible APIs with native TypeScript and ESM support, and integrates directly into the Rstack toolchain (Rspack, Rsbuild, Rslib, Rspress).

Key things that distinguish Rstest from Jest/Vitest:

- **Build tooling is Rspack**, not Babel or Vite — it reuses your existing Rsbuild/Rspack config
- **Two separate utility namespaces**: `rs` for module-level operations (mocking modules), and `rstest` for runtime utilities (fn, spyOn, timers). Both are imported from `@rstest/core`
- **`rs.mock()` without a factory is NOT auto-mock** — it looks for `__mocks__/` directory only. For auto-mocking, pass `{ mock: true }`. This is the biggest gotcha when migrating from Vitest
- **Mock factories cannot be async** — use `import ... with { rstest: 'importActual' }` for partial mocks instead
- **No `--run` flag** — `rstest` already runs once and exits. Use `rstest --watch` or `rstest watch` for watch mode
- Node.js ≥ 20.19.0 required

---

## Setup

### Install

```bash
# npm / pnpm / yarn / bun
pnpm add @rstest/core -D
```

### package.json scripts

```json
{
  "scripts": {
    "test": "rstest",
    "test:watch": "rstest watch"
  }
}
```

### Configuration file

Rstest auto-discovers config files in the project root in this order: `rstest.config.mjs`, `.ts`, `.js`, `.cjs`, `.mts`, `.cts`.

```ts
// rstest.config.ts
import { defineConfig } from '@rstest/core';

export default defineConfig({
  // Test config is at the top level — NOT nested under a `test` key (unlike Vitest)
  include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  exclude: ['**/node_modules/**', '**/dist/**'],
  testEnvironment: 'node', // 'node' | 'jsdom' | 'happy-dom'
  globals: false,          // set true to skip imports in test files
  setupFiles: [],          // runs before each test file
  testTimeout: 5000,
  retry: 0,
});
```

If your project already uses Rsbuild or Rslib, use the official adapters to avoid config duplication — see "Rsbuild / Rslib integration" below.

---

## Writing tests

### Imports

```ts
import { describe, test, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@rstest/core';
import { rs } from '@rstest/core';     // module-level mocking
import { rstest } from '@rstest/core'; // runtime utilities (fn, spyOn, timers)
```

When `globals: true` is set, all of these are available globally without imports.

### Basic test

```ts
import { expect, test } from '@rstest/core';

test('adds numbers', () => {
  expect(1 + 2).toBe(3);
});
```

### Grouping

```ts
import { describe, expect, test } from '@rstest/core';

describe('math utils', () => {
  test('adds', () => expect(add(1, 2)).toBe(3));
  test('subtracts', () => expect(sub(3, 1)).toBe(2));
});
```

### Async tests

```ts
test('fetches user', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Alice');
});
```

### Parameterized tests

```ts
// .each (printf-style)
test.each([
  [1, 2, 3],
  [0, 0, 0],
])('add(%i, %i) = %i', (a, b, expected) => {
  expect(add(a, b)).toBe(expected);
});

// .for (type-safe, modern)
test.for([
  { a: 1, b: 2, expected: 3 },
])('add($a, $b) = $expected', ({ a, b, expected }) => {
  expect(add(a, b)).toBe(expected);
});
```

### Modifiers

```ts
test.skip('disabled', () => { /* ... */ });
test.only('focus', () => { /* ... */ });
test.todo('implement later');
test.fails('expected to throw', () => { throw new Error(); });
test.concurrent('runs in parallel', async () => { /* ... */ });
test.sequential('forced serial', async () => { /* ... */ });
```

### Lifecycle hooks

```ts
beforeAll(() => { /* once before suite */ });
afterAll(() => { /* once after suite */ });
beforeEach(() => { /* before each test */ });
afterEach(() => { /* after each test */ });
```

The return value of `beforeEach`/`beforeAll` is used as a cleanup function (runs after) — make sure to wrap void calls in braces: `beforeEach(() => { doSomething() })`.

---

## Mocking modules — the `rs` object

`rs` is the module-level mocking utility. `rs.mock()` is **hoisted** to the top of the file automatically.

### Factory mock

```ts
import { rs } from '@rstest/core';
import { fetchUser } from './api';

rs.mock('./api', () => ({
  fetchUser: rs.fn().mockResolvedValue({ id: 1, name: 'Alice' }),
}));

test('mocked', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Alice');
  expect(fetchUser).toHaveBeenCalledWith(1);
});
```

### Auto-mock with `{ mock: true }`

All exports become mock functions returning `undefined`. Original implementations are NOT preserved.

```ts
rs.mock('./math', { mock: true });
```

### Spy mock with `{ spy: true }`

All exports are wrapped in spy functions but the **original implementation is preserved**. Ideal for asserting calls without replacing behavior.

```ts
rs.mock('./calculator', { spy: true });
```

### `__mocks__` directory

`rs.mock('./module')` without a second argument looks for a matching file in a `__mocks__/` sibling directory. If none is found, it throws (unlike Vitest which falls back to auto-mock).

### Partial mock with `importActual`

Use the `with { rstest: 'importActual' }` import attribute to synchronously load the real module, then spread it in the factory:

```ts
import * as apiActual from './api' with { rstest: 'importActual' };

rs.mock('./api', () => ({
  ...apiActual,
  fetchUser: rs.fn().mockResolvedValue({ id: 'mocked' }),
}));
```

Or use the async version inside tests:

```ts
rs.mock('./sum');
test('partial', async () => {
  const actual = await rs.importActual('./sum');
  expect(actual.sum(1, 2)).toBe(3);
});
```

### Hoisting shared values

Because `rs.mock` is hoisted, variables defined later in the file aren't available in the factory. Use `rs.hoisted()` to create values accessible from mock factories:

```ts
const mocks = rs.hoisted(() => ({
  myFn: rs.fn(),
}));

rs.mock('./module', () => ({ default: mocks.myFn }));

test('works', () => {
  mocks.myFn.mockReturnValue(42);
  // ...
});
```

### Other module mock utilities

| API | Description |
|---|---|
| `rs.doMock(path, factory?)` | Like `rs.mock` but NOT hoisted — applies only to imports after this call |
| `rs.unmock(path)` | Cancel a mock (hoisted) — useful to unmock setup file mocks |
| `rs.doUnmock(path)` | Non-hoisted unmock |
| `rs.importMock(path)` | Import a module with all properties as mock implementations |
| `rs.resetModules()` | Clear module cache (does not clear mocks) |

### Gotcha: mocking re-exported modules

Rspack may resolve re-exports to the source module. If mocking `react-router-dom` doesn't work, mock `react-router` instead. Alternatively, disable `optimization.providedExports` in `tools.rspack`.

---

## Mock functions — the `rstest` object

`rstest` is the runtime utility for creating mock functions, spies, timers and stubs.

### Creating mocks

```ts
import { rstest } from '@rstest/core';

const fn = rstest.fn();
fn.mockReturnValue(42);
expect(fn()).toBe(42);
expect(fn).toHaveBeenCalledOnce();

// With implementation
const greet = rstest.fn((name: string) => `hi ${name}`);
```

### Spying on methods

```ts
const spy = rstest.spyOn(console, 'log').mockImplementation(() => {});
// ...
expect(spy).toHaveBeenCalledWith('hello');
spy.mockRestore();
```

### `rstest.mockObject()` — deep mock an object

```ts
const mocked = rstest.mockObject(originalObj);
// All methods return undefined and are mock functions
// Primitives are preserved

// With { spy: true }, original implementations are kept:
const spied = rstest.mockObject(originalObj, { spy: true });
```

### `rstest.mocked()` — TypeScript type helper

Wraps a mocked module with proper `MockInstance` types (no runtime effect):

```ts
const mockedModule = rstest.mocked(myModule);
mockedModule.method.mockReturnValue('test');
```

### Clearing / resetting

```ts
rstest.clearAllMocks();   // clear call history
rstest.resetAllMocks();   // reset implementations
rstest.restoreAllMocks(); // restore original (for spies)
```

Or configure auto-clearing per test:

```ts
// rstest.config.ts
export default defineConfig({
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
});
```

---

## Environment stubs

```ts
rstest.stubEnv('NODE_ENV', 'production');
rstest.stubGlobal('fetch', rstest.fn());

// Auto-restored with unstubEnvs/unstubGlobals config, or manually:
rstest.unstubAllEnvs();
rstest.unstubAllGlobals();
```

---

## Fake timers

```ts
rstest.useFakeTimers();

const cb = rstest.fn();
setTimeout(cb, 1000);

rstest.advanceTimersByTime(1000);
expect(cb).toHaveBeenCalledOnce();

rstest.useRealTimers();
```

Other timer APIs: `runAllTimers()`, `runAllTimersAsync()`, `runOnlyPendingTimers()`, `advanceTimersToNextTimer()`, `advanceTimersToNextFrame()`, `setSystemTime(date)`, `getRealSystemTime()`, `getTimerCount()`, `clearAllTimers()`.

---

## Assertions (`expect`)

Jest-compatible. Key matchers:

```ts
expect(val).toBe(42);                  // strict ===
expect(obj).toEqual({ a: 1 });         // deep equality
expect(obj).toStrictEqual({ a: 1 });   // deep + type equality
expect(val).toBeTruthy();
expect(val).toBeNull();
expect(0.1 + 0.2).toBeCloseTo(0.3);
expect(arr).toContain(item);
expect(arr).toHaveLength(3);
expect(obj).toHaveProperty('key', val);
expect(() => fn()).toThrow('msg');
await expect(promise).resolves.toBe('ok');
await expect(promise).rejects.toThrow();
expect.soft(a).toBe(1); // non-failing, continues
expect(val).not.toBe(0);
```

### Mock matchers

```ts
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg);
expect(fn).toHaveBeenCalledTimes(2);
expect(fn).toHaveBeenCalledOnce();
expect(fn).toHaveReturnedWith(value);
```

---

## Snapshots

```ts
expect(data).toMatchSnapshot();
expect(data).toMatchSnapshot('descriptive name');
expect(msg).toMatchInlineSnapshot('"Hello World"');
await expect(html).toMatchFileSnapshot('./basic.output.html');
```

Snapshots stored in `__snapshots__/*.snap`. Update with `rstest -u`.

Custom serializers for paths/sensitive data:

```ts
expect.addSnapshotSerializer({
  test: (val) => typeof val === 'string' && val.startsWith('/'),
  print: (val) => '"<PATH>"',
});
```

---

## DOM testing

Set the test environment to simulate browser APIs in Node:

```ts
// rstest.config.ts
export default defineConfig({
  testEnvironment: 'jsdom', // or 'happy-dom' (faster)
});
```

### React

```bash
pnpm add @rstest/core @rsbuild/plugin-react @testing-library/react @testing-library/jest-dom happy-dom -D
```

```ts
// rstest.config.ts
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rstest/core';

export default defineConfig({
  plugins: [pluginReact()],
  testEnvironment: 'happy-dom',
  setupFiles: ['./rstest.setup.ts'],
});
```

```ts
// rstest.setup.ts
import { afterEach, expect } from '@rstest/core';
import { cleanup } from '@testing-library/react';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';

expect.extend(jestDomMatchers);
afterEach(() => cleanup());
```

```tsx
// App.test.tsx
import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders greeting', () => {
  render(<App />);
  expect(screen.getByText('Hello World')).toBeInTheDocument();
});
```

> **Note**: Do NOT import `@testing-library/jest-dom/vitest` — that's Vitest-specific. Use the matchers approach above.

### Vue

```bash
pnpm add @rstest/core @rsbuild/plugin-vue @vue/test-utils happy-dom -D
```

```ts
// rstest.config.ts
import { pluginVue } from '@rsbuild/plugin-vue';
import { defineConfig } from '@rstest/core';

export default defineConfig({
  plugins: [pluginVue()],
  testEnvironment: 'happy-dom',
});
```

```ts
import { expect, test } from '@rstest/core';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

test('renders', () => {
  const wrapper = mount(App);
  expect(wrapper.text()).toContain('Hello World');
});
```

---

## Browser Mode (experimental)

For real browser testing with Playwright (when jsdom/happy-dom isn't enough):

```bash
pnpm add @rstest/core @rstest/browser -D
npx playwright install chromium
```

```ts
// rstest.config.ts (or rstest.browser.config.ts)
import { defineConfig } from '@rstest/core';

export default defineConfig({
  browser: {
    enabled: true,
    provider: 'playwright',
    // headless: true,  // auto in CI
  },
});
```

```ts
import { page } from '@rstest/browser';
import { expect, test } from '@rstest/core';

test('counter clicks', async () => {
  document.body.innerHTML = '<button id="btn">0</button>';
  // Use Playwright-style locator API
  await page.getByRole('button').click();
  await expect.element(page.getByText('1')).toBeVisible();
});
```

Quick setup: `npx rstest init browser` scaffolds config + sample tests automatically.

---

## Code coverage

```ts
// rstest.config.ts
export default defineConfig({
  coverage: {
    enabled: true,     // or use CLI: rstest --coverage
    provider: 'istanbul',
    include: ['src/**'],
    exclude: ['**/*.test.ts'],
  },
});
```

---

## In-source tests

Rust-style tests inside source files:

```ts
// src/utils.ts
export function add(a: number, b: number) { return a + b; }

if (import.meta.rstest) {
  const { test, expect } = await import('@rstest/core');
  test('add', () => expect(add(1, 2)).toBe(3));
}
```

```ts
// rstest.config.ts
export default defineConfig({ includeSource: ['src/**/*.ts'] });
```

In production builds, set `source.define: { 'import.meta.rstest': false }` to tree-shake test code.

---

## Multi-project testing

```ts
// rstest.config.ts (root)
export default defineConfig({
  projects: [
    'packages/*',                  // each subdir with its own rstest.config.ts
    {
      name: 'node-tests',
      include: ['tests/node/**/*.test.ts'],
      testEnvironment: 'node',
    },
    {
      name: 'dom-tests',
      include: ['tests/dom/**/*.test.tsx'],
      testEnvironment: 'jsdom',
    },
  ],
});
```

Sub-projects use `defineProject` instead of `defineConfig`. Shared config via `mergeRstestConfig`. Filter projects with `rstest --project 'name'`.

---

## Rsbuild / Rslib integration

### Rsbuild adapter

```bash
pnpm add @rstest/adapter-rsbuild -D
```

```ts
import { defineConfig } from '@rstest/core';
import { withRsbuildConfig } from '@rstest/adapter-rsbuild';

export default defineConfig({
  extends: withRsbuildConfig(), // reads rsbuild.config.ts automatically
  testEnvironment: 'happy-dom',
  setupFiles: ['./rstest.setup.ts'],
});
```

Options: `cwd`, `configPath`, `environmentName`, `modifyRsbuildConfig`.

### Rslib adapter

```bash
pnpm add @rstest/adapter-rslib -D
```

```ts
import { defineConfig } from '@rstest/core';
import { withRslibConfig } from '@rstest/adapter-rslib';

export default defineConfig({
  extends: withRslibConfig(), // reads rslib.config.ts automatically
});
```

Options: `cwd`, `configPath`, `libId`, `modifyLibConfig`.

### Detect test environment in source

```ts
if (process.env.RSTEST) { /* only during tests */ }
```

In production builds: `source.define: { 'process.env.RSTEST': false }` for tree-shaking.

---

## CLI reference

| Command | Purpose |
|---|---|
| `rstest` | Run all tests (exits after, no watch) |
| `rstest watch` / `rstest --watch` | Watch mode |
| `rstest run` | Single run (explicit, for CI) |
| `rstest list` | List matching tests |
| `rstest init browser` | Scaffold Browser Mode |
| `rstest -u` | Update snapshots |
| `rstest --coverage` | Enable coverage |
| `rstest -t "pattern"` | Filter by test name (regex) |
| `rstest path/to/file` | Run specific file |
| `rstest --project "name"` | Filter by project |
| `rstest --testEnvironment jsdom` | Override env via CLI |
| `DEBUG=rstest rstest` | Debug mode (writes configs to dist) |

Watch shortcuts: `f` rerun failed · `a` rerun all · `u` update snapshots · `t` filter name · `p` filter path · `q` quit

---

## Migration cheat sheet

### From Vitest

| Vitest | Rstest |
|---|---|
| `import { vi } from 'vitest'` | `import { rs } from '@rstest/core'` |
| `vi.fn()` | `rs.fn()` |
| `vi.mock('./foo')` (auto-mocks) | `rs.mock('./foo', { mock: true })` |
| `vi.mock('./foo', factory)` | `rs.mock('./foo', factory)` |
| `vi.spyOn(obj, 'method')` | `rs.spyOn(obj, 'method')` |
| `vi.hoisted(() => ...)` | `rs.hoisted(() => ...)` |
| `test.environment = 'jsdom'` in config | `testEnvironment: 'jsdom'` (top-level) |
| `@testing-library/jest-dom/vitest` | `expect.extend(jestDomMatchers)` manually |
| `vitest.config.ts` with `test: { ... }` | `rstest.config.ts` (flat, no `test` wrapper) |
| Vite plugins (`@vitejs/plugin-react`) | Rsbuild plugins (`@rsbuild/plugin-react`) |
| Factory can be async | Factory must be sync — use `with { rstest: 'importActual' }` |

### From Jest

| Jest | Rstest |
|---|---|
| `jest.fn()` | `rstest.fn()` or `rs.fn()` |
| `jest.mock('./foo')` | `rs.mock('./foo', { mock: true })` |
| `jest.spyOn(obj, 'method')` | `rstest.spyOn(obj, 'method')` |
| `jest.setTimeout(5000)` | `rstest.setConfig({ testTimeout: 5000 })` |
| `done` callback | Return a Promise or use async/await |
| `jest.config.js` | `rstest.config.ts` with `defineConfig()` |
| `setupFilesAfterEnv` | `setupFiles` |
| `moduleNameMapper` | `resolve.alias` |
| `transformIgnorePatterns` | `output.externals` / `source.exclude` |
| `@swc/jest` transform | Built-in SWC (configure via `tools.swc`) |

---

## Debugging

```bash
# Debug mode — writes resolved config to dist/
DEBUG=rstest pnpm test
```

VS Code launch config:

```json
{
  "name": "Debug Current Test File",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/@rstest/core/bin/rstest.js",
  "args": ["run", "${file}"],
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"]
}
```

---

## References

For deeper detail on specific topics, consult the official documentation:

- [Rstest docs](https://rstest.rs/) — Full guide and API reference
- [Configuration reference](https://rstest.rs/config/) — All test and build config options
- [Runtime API](https://rstest.rs/api/runtime-api/) — expect, test, describe, hooks, mock, timers
- [Mock modules](https://rstest.rs/api/runtime-api/rstest/mock-modules) — rs.mock, rs.hoisted, importActual
- [Browser Mode](https://rstest.rs/guide/browser-testing/) — Playwright integration
- [React guide](https://rstest.rs/guide/framework/react) — React + Testing Library setup
- [Vue guide](https://rstest.rs/guide/framework/vue) — Vue + @vue/test-utils setup
- [Migration from Jest](https://rstest.rs/guide/migration/jest)
- [Migration from Vitest](https://rstest.rs/guide/migration/vitest)
- [GitHub](https://github.com/web-infra-dev/rstest)
