import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import eslintPluginImportsPaths from 'eslint-plugin-no-relative-import-paths'
import reactPlugin from 'eslint-plugin-react'
import globals from 'globals'
import tsEslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: ['**/out/*', '**/.*', 'next-env.d.ts'],
  },

  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  eslintConfigPrettier,
  importPlugin.flatConfigs.recommended,

  {
    plugins: {
      '@typescript-eslint': tsEslint.plugin,
      'no-relative-import-paths': eslintPluginImportsPaths,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsEslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {},
      },
    },

    rules: {
      'import/no-unresolved': 'off',

      'import/newline-after-import': [
        'warn',
        {
          count: 1,
        },
      ],

      'import/order': [
        'warn',
        {
          alphabetize: { order: 'asc' },
          pathGroups: [{ pattern: '~**/**', group: 'parent', position: 'before' }],
        },
      ],

      'no-relative-import-paths/no-relative-import-paths': [
        'warn',
        {
          allowSameFolder: true,
          rootDir: 'src',
          prefix: '~',
        },
      ],

      'no-duplicate-imports': [
        'error',
        {
          includeExports: true,
        },
      ],

      'object-shorthand': ['error', 'always'],
      'no-console': ['warn'],

      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
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
  {
    files: ['eslint.config.mjs'],
    extends: [tsEslint.configs.disableTypeChecked],
  },
)
