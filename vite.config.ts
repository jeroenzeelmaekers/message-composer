import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "lexical-vendor",
              test: /node_modules[\\/].*?[\\/]node_modules[\\/](?:@lexical[\\/][^\\/]+|lexical)[\\/]/,
              priority: 20,
            },
            {
              name: "react-vendor",
              test: /node_modules[\\/].*?[\\/]node_modules[\\/](?:react-dom|react|scheduler)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp,direnv}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
    ],
  },
  lint: {
    ignorePatterns: [".direnv/**", "dist/**"],
    plugins: ["react"],
    categories: {
      correctness: "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "react/exhaustive-deps": "warn",
      "react/only-export-components": ["warn", { allowConstantExport: true }],
      "react/rules-of-hooks": "error",
    },
  },
  fmt: {},
});
