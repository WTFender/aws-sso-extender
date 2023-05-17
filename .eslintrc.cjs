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
        'src/**/*.ts',
        'src/**/*.d.ts'
      ],
      extends: [
        'plugin:vue/vue3-recommended',
        '@vue/eslint-config-airbnb-with-typescript'
      ],
      parserOptions: {
        project: [
          './tsconfig.json'
        ]
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
