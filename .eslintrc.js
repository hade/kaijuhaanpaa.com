module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: [
    // ...
    "airbnb-base",
    "prettier",
    "next",
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    semi: ["error", "never"],
    "no-console": "off",
  },
}
