import path from 'node:path';
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  eslint.configs.recommended,

  {
    files: ['src/**/*.{ts,tsx}'],

    languageOptions: {
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
      parser: tsParser,

      parserOptions: {
        project: path.resolve('frontend', 'tsconfig.json'),
        tsconfigRootDir: path.resolve('frontend'),
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },

    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
    },

    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];
