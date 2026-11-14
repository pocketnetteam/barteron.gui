import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** Static methods newer than the oldest engines, with what to use instead. */
const NEWER_STATICS = [
  ['Object', 'hasOwn', 'Chrome 93, Safari 15.4: Object.prototype.hasOwnProperty.call'],
  ['Object', 'groupBy', 'Chrome 117'],
  ['Map', 'groupBy', 'Chrome 117'],
  ['Array', 'fromAsync', 'Chrome 121'],
  ['Promise', 'withResolvers', 'Chrome 119'],
  ['AbortSignal', 'timeout', 'Chrome 103, Safari 16: AbortController and setTimeout'],
  ['AbortSignal', 'any', 'Chrome 116'],
  ['crypto', 'randomUUID', 'Chrome 92, Safari 15.4'],
].map(([object, property, message]) => ({ object, property, message }))

const NEWER_GLOBALS = [{ name: 'structuredClone', message: 'Chrome 98, Safari 15.4' }]

const NEWER_SYNTAX = [
  {
    selector:
      'CallExpression[callee.property.name=/^(at|findLast|findLastIndex|toSorted|toReversed|toSpliced|with)$/]',
    message:
      '.at() — Chrome 92, Safari 15.4; findLast — Chrome 97; toSorted, toReversed, toSpliced, with — Chrome 110, Safari 16',
  },
  { selector: 'Literal[regex.flags=/[dv]/]', message: 'RegExp d — Chrome 90, v — Chrome 112' },
]

export default defineConfig(
  {
    ignores: [
      'dist/',
      'coverage/',
      'test-results/',
      'playwright-report/',
      '_docs-todo/',
      // Vendored copy of the host SDK, kept verbatim
      'e2e/fixtures/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // The host's fetch tunnel runs as a service worker.
    files: ['public/miniapp-service-worker.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
  {
    files: ['*.config.{js,ts}', 'build/**', 'e2e/**'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{ts,vue}'],
    rules: {
      // TypeScript already reports undefined names.
      'no-undef': 'off',
      // Optional typed props are undefined by default; a default adds nothing.
      'vue/require-default-prop': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Tests define small wrapper components inline.
    files: ['**/*.test.ts'],
    rules: { 'vue/one-component-per-file': 'off' },
  },
  {
    // The oldest engines: Chrome 89, Firefox 89, Safari 15 (vite.config.ts; the
    // old Bastyon desktop app runs Chromium 89). esbuild lowers syntax, not
    // methods: these are missing there. CSS — build/engines.test.ts.
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/**/*.test.ts', 'src/test/**'],
    rules: {
      'no-restricted-properties': ['error', ...NEWER_STATICS],
      'no-restricted-globals': ['error', ...NEWER_GLOBALS],
      'no-restricted-syntax': ['error', ...NEWER_SYNTAX],
      'vue/no-restricted-syntax': ['error', ...NEWER_SYNTAX],
    },
  },
  prettier
)
