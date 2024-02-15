module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  plugins: [
    'vue',
    '@typescript-eslint'
  ],
  ignorePatterns: ["*.cjs"],
  overrides: [
    {
      files: [
        'src/**/*.vue',
        'src/**/*.ts',
        'src/**/*.d.ts'
      ],
      extends: [
        'plugin:vue/vue3-recommended',
      ],
      parserOptions: {
        project: [
          './tsconfig.json'
        ],
        extraFileExtensions: ['.vue']
      },
      rules: {
        'linebreak-style': 0,
        'vuejs-accessibility/click-events-have-key-events': 'off',
        'no-param-reassign': ['error', { props: false }],
      }
    }
  ],
  rules: {}
}
