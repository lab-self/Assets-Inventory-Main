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
        localStorage: 'readonly',
        Headers: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        confirm: 'readonly',
      },
      parser: tsParser,

      parserOptions: {
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
      'no-undef': 'off', // TypeScript checks names, including DOM types.
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
