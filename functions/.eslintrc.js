module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  globals: {
    process: "readonly",
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: [
    "react"
  ],
  rules: {
    "no-undef": "error",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
