import globals from 'globals';
import airbnbStyle from 'eslint-config-airbnb-base/rules/style';
import {
  base,
  ignores,
  mocha,
  typescript,
} from 'eslint-config-ucprojects';

const readonly = 'readonly';
const [level, ...restricted] = airbnbStyle.rules['no-restricted-syntax'];
const noNode = Object.fromEntries(Object.keys(globals.node).map((name) => [name, 'off']));

export default [
  ...ignores,
  {
    ignores: [
      'test/types/**',
      '_site/**',
      'docs/**',
    ],
  },
  ...base,
  {
    settings: {
      'import/resolver': {
        node: { extensions: ['.js', '.mjs', '.ts', '.json'] },
      },
    },
    rules: {
      camelcase: ['warn', { ignoreGlobals: true, allow: ['^GM_'] }],
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
        globalThis: readonly,
        window: 'off',
      },
    },
  },
  {
    files: ['src/**'],
    rules: {
      'no-restricted-syntax': [level, ...restricted, {
        selector: "VariableDeclaration[kind='let']:not(ForStatement > VariableDeclaration)",
        message: 'Keep changing state in a VarStore instead of a let.',
      }],
    },
  },
  {
    files: ['src/bundle/**'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
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
  ...typescript,
  {
    files: ['src/utils/**'],
    rules: {
      'no-return-assign': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
    },
  },
  ...mocha,
  {
    files: ['test/**'],
    languageOptions: {
      globals: {
        $: readonly,
        window: readonly,
        document: readonly,
        GM_info: readonly,
        localStorage: readonly,
      },
    },
  },
  {
    files: ['test/setup/**'],
    rules: {
      'import/prefer-default-export': 'off',
    },
  },
];
