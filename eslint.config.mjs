import js from "@eslint/js";

export default [
  {
    ignores: [
      "_site/**",
      ".build/**",
      ".cache/**",
      ".visual-reference/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "tests/visual-baseline/**",
      "src/assets/js/calendar-button.js",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/assets/js/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        HTMLElement: "readonly",
        HTMLFormElement: "readonly",
        customElements: "readonly",
        IntersectionObserver: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        FormData: "readonly"
      }
    }
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        fetch: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly"
      }
    }
  },
  {
    files: ["tests/**/*.mjs"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        Event: "readonly",
        MessageEvent: "readonly"
      }
    }
  }
];
