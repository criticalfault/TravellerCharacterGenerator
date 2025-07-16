module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Disable prettier rule that's causing issues
    'prettier/prettier': 'off',
    // Allow implicit any types
    '@typescript-eslint/no-implicit-any': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};