/**
 * ESLint Configuration for Vantus Mobile App
 * React Native + JavaScript
 */

module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    'react-native/react-native': true,
    es6: true,
    node: true,
  },
  plugins: [
    'react',
    'react-native',
  ],
  rules: {
    // Code Quality
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Prefer logger utility
    'no-debugger': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'prefer-const': 'warn',
    'no-var': 'error',
    
    // Best Practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-await': 'error',
    'require-await': 'warn',
    
    // Style
    'indent': ['warn', 2, { SwitchCase: 1 }],
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['warn', 'always-multiline'],
    'object-curly-spacing': ['warn', 'always'],
    'array-bracket-spacing': ['warn', 'never'],
    
    // React/React Native
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    
    // Vantus-specific rules
    'no-hardcoded-values': 'off', // Custom rule - check for hardcoded URLs, IDs, etc.
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules/',
    '*.config.js',
    'babel.config.js',
  ],
};
