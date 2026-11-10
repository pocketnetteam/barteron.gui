import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

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
      // Host fetch tunnel, copied from the old app verbatim
      'public/miniapp-service-worker.js',
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
  prettier
)
