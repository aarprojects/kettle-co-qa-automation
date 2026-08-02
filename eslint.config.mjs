// Flat config (eslint 9+). Same rules as the old .eslintrc.json, the
// upgrade itself was to clear the brace-expansion audit advisory the
// eslint 8 dependency chain dragged in.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['playwright-report/', 'test-results/', 'node_modules/'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
);
