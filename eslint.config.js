import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL('.', import.meta.url)),
});

const readonly = 'readonly';
const noNode = Object.fromEntries(Object.keys(globals.node).map((name) => [name, 'off']));

export default [
  {
    ignores: [
      '**/*.ignore*',
      '**/*.d.ts',
      'test/types/**',
      'dist/**',
      'node_modules/**',
      '_site/**',
      '.vscode/**',
      'docs/**',
    ],
  },
  ...compat.extends('airbnb-base'),
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.js', '.mjs', '.ts', '.json'] },
      },
    },
    languageOptions: {
      ecmaVersion: 'latest',
    },
    rules: {
      camelcase: ['warn', { ignoreGlobals: true, allow: ['^GM_'] }],
      'consistent-return': 'warn',
      'lines-between-class-members': ['error', 'always', {
        exceptAfterSingleLine: true,
      }],
      'no-param-reassign': ['warn', { props: false }],
      'no-unused-expressions': ['error', { allowShortCircuit: true }],
      'no-unused-vars': ['error', { args: 'none' }],
      'no-use-before-define': ['error', 'nofunc'],
      'prefer-destructuring': ['error', {
        AssignmentExpression: { array: true, object: false },
      }],
      'no-plusplus': ['warn', { allowForLoopAfterthoughts: true }],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
      'no-useless-return': 'warn',
      'class-methods-use-this': 'off',
      'no-restricted-globals': ['error', ''],
      'no-bitwise': 'off',
      'no-mixed-operators': 'off',
      'import/no-mutable-exports': 'warn',
      'no-continue': 'off',
      'object-curly-newline': ['error', { multiline: true, consistent: true }],
      'operator-linebreak': ['error', 'after'],
      quotes: ['error', 'single', { allowTemplateLiterals: true, avoidEscape: true }],
      'no-extra-boolean-cast': 'warn',
      'import/extensions': ['error', 'ignorePackages', {
        ts: 'never',
        js: 'never',
        json: 'always',
      }],
      'import/no-extraneous-dependencies': ['error', {
        devDependencies: ['./scripts/**', './src/**', './test/**', '*'],
        optionalDependencies: false,
        peerDependencies: false,
        bundledDependencies: false,
      }],
      'import/no-unresolved': ['error', {
        ignore: ['src/', '^typescript-eslint$'],
      }],
      'max-len': ['error', {
        code: 120,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        tabWidth: 2,
      }],
    },
  },
  {
    files: ['*.js', '*.cjs', 'scripts/**', 'test/**'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['scripts/**', 'rollup.config.js', 'test/setup/**'],
    rules: {
      'import/extensions': ['error', {
        js: 'always',
        json: 'always',
      }],
    },
  },
  {
    files: ['src/**'],
    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          globalReturn: true,
        },
      },
      globals: {
        ...noNode,
        ...globals.browser,
        ...globals.jquery,
        ...globals.greasemonkey,
        BootstrapDialog: readonly,
        SimpleToast: readonly,
        VERSION: readonly,
        Sentry: readonly,
        globalThis: readonly,
        window: 'off',
      },
    },
  },
  {
    files: ['src/base/plugin/**'],
    languageOptions: {
      globals: {
        registerModule: readonly,
        settings: readonly,
      },
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
    },
  },
  {
    files: ['src/utils/**'],
    rules: {
      'no-return-assign': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['test/**'],
    languageOptions: {
      globals: {
        ...globals.mocha,
        $: readonly,
        window: readonly,
        document: readonly,
        GM_info: readonly,
        localStorage: readonly,
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-expressions': 'off',
    },
  },
  {
    files: ['test/setup/**'],
    rules: {
      'import/prefer-default-export': 'off',
    },
  },
];
