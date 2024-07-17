import _import from 'eslint-plugin-import'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'
import tsEslint from 'typescript-eslint'
import { fixupPluginRules } from '@eslint/compat'
import jsEslint from '@eslint/js'

export default [
  {
    ignores: ['**/out/*', '**/forever-ignore/*', 'logfiles/*', '.yarn'],
  },
  jsEslint.configs.recommended,
  ...tsEslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      import: fixupPluginRules(_import),
    },

    languageOptions: {
      globals: {
        ...globals.node,
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
              pattern: '@**',
              group: 'parent',
              position: 'before',
            },
            {
              pattern: '@**/**',
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
      'no-console': ['off'],
      'prefer-const': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
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
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]
