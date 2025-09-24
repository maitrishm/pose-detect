module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint','react','react-hooks','import'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  settings: {
    react: { version: 'detect' }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'import/order': ['warn', { 'newlines-between': 'always', groups: ['builtin','external','internal','parent','sibling','index'] }]
  },
  overrides: [
    {
      files: ['**/*.ts','**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn'
      }
    },
    {
      files: ['**/__tests__/**/*.{ts,tsx,js,jsx}'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['*.ts','*.tsx'],
      rules: {
        'next/no-html-link-for-pages': 'off'
      }
    }
  ],
  ignorePatterns: ['client/.next','server/dist']
};
