import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import eslintConfigPrettier from 'eslint-config-prettier'
import _import from 'eslint-plugin-import'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import tsEslint from 'typescript-eslint'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: ['**/out/*', '**/.*'],
  },
  ...fixupConfigRules(compat.extends('eslint:recommended', 'plugin:react/recommended')),
  ...tsEslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      import: fixupPluginRules(_import),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      'import/newline-after-import': [
        'warn',
        {
          count: 1,
        },
      ],

      'import/order': [
        'warn',
        {
          groups: ['external', 'builtin', 'parent', 'sibling', 'internal', 'index', 'object'],

          pathGroups: [
            {
              pattern: './*.module.css',
              group: 'object',
            },
            {
              pattern: '~**',
              group: 'parent',
              position: 'before',
            },
            {
              pattern: '~**/**',
              group: 'parent',
              position: 'before',
            },
          ],

          pathGroupsExcludedImportTypes: [],
        },
      ],

      'no-duplicate-imports': [
        'error',
        {
          includeExports: true,
        },
      ],

      'object-shorthand': ['error', 'always'],
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'no-console': ['warn'],
      'react/prop-types': 'off',
      'react/jsx-curly-brace-presence': 'warn',

      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          shorthandFirst: true,
          reservedFirst: true,
          noSortAlphabetically: true,
        },
      ],

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-use-before-define': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],

      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lodash',
              message: 'Please use lodash-es instead.',
            },
          ],

          patterns: ['lodash-es/*'],
        },
      ],
    },
  },
]
