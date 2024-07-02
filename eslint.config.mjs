import globals from "globals";

export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  },
  {
    languageOptions: {
      globals: globals.browser
    }
  },
  {
    languageOptions: {
      globals: globals.node
    }
  }
];
