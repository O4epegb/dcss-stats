import jsEslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
// @ts-expect-error no types
import importPlugin from 'eslint-plugin-import'
import eslintPluginImportsPaths from 'eslint-plugin-no-relative-import-paths'
import globals from 'globals'
import tsEslint from 'typescript-eslint'

export default tsEslint.config(
  {
    ignores: ['**/out/*', '**/forever-ignore/*', 'morgues/*', 'logfiles/*', '.yarn', 'crawl/**/*'],
  },

  jsEslint.configs.recommended,
  ...tsEslint.configs.recommended,
  eslintConfigPrettier,
  importPlugin.flatConfigs.recommended,

  {
    plugins: {
      'no-relative-import-paths': eslintPluginImportsPaths,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tsEslint.parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js'],
          defaultProject: './tsconfig.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import/resolver': {
        typescript: {},
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

      'object-shorthand': ['warn', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
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
  {
    files: ['eslint.config.mjs', 'prisma.js'],
    extends: [tsEslint.configs.disableTypeChecked],
  },
)
