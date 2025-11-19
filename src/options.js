export const packageManagers = [
  {
    id: "pnpm",
    label: "pnpm",
    description: "Fast installs, workspace support, and efficient disk usage.",
    badge: "Recommended",
  },
  {
    id: "npm",
    label: "npm",
    description: "Ships with Node.js. Great for simple single apps.",
  },
  {
    id: "yarn",
    label: "Yarn",
    description: "Plug'n'Play and rock solid monorepo tooling.",
  },
  {
    id: "bun",
    label: "Bun",
    description: "Experimental runtime with a blazing fast package manager.",
  },
];

export const frameworks = [
  {
    id: "react",
    label: "React + Vite",
    description: "Component driven UI with a massive ecosystem.",
    docs: "https://react.dev",
    createCommand: ({ manager, useTypescript, project }) => {
      const template = useTypescript ? "react-ts" : "react";
      const lookup = {
        npm: [
          "npm",
          [
            "create",
            "vite@latest",
            project,
            "--",
            "--template",
            template,
            "--no-interactive",
          ],
          { input: "y\n" },
        ],
        pnpm: [
          "pnpm",
          [
            "create",
            "vite@latest",
            project,
            "--",
            "--template",
            template,
            "--no-interactive",
          ],
        ],
        yarn: [
          "yarn",
          [
            "create",
            "vite",
            project,
            "--",
            "--template",
            template,
            "--no-interactive",
          ],
        ],
        bun: [
          "bun",
          [
            "create",
            "vite",
            project,
            "--",
            "--template",
            template,
            "--no-interactive",
          ],
        ],
      };
      return [lookup[manager]];
    },
    notes: [
      "Equalizer runs Vite non-interactively and handles dependency installation based on your selections.",
    ],
  },
  {
    id: "vue",
    label: "Vue 3 + Vite",
    description: "Composition API with great TS support and a calm DX.",
    docs: "https://vuejs.org",
    createCommand: ({ manager, project }) => {
      const lookup = {
        npm: ["npm", ["create", "vue@latest", project]],
        pnpm: ["pnpm", ["create", "vue@latest", project]],
        yarn: ["yarn", ["create", "vue", project]],
        bun: ["bun", ["create", "vue", project]],
      };
      return [lookup[manager]];
    },
    notes: [
      "Choose the TypeScript preset in the Vue CLI wizard if you need typing from day one.",
    ],
  },
  {
    id: "angular",
    label: "Angular",
    description:
      "Batteries included framework with DI, RxJS, and CLI generators.",
    docs: "https://angular.dev",
    forceTypescript: true,
    createCommand: ({ manager, project }) => {
      const effectiveManager = manager === "bun" ? "npm" : manager;
      return [
        [
          "npx",
          [
            "@angular/cli",
            "new",
            project,
            "--routing",
            "--style=scss",
            "--strict",
            "--package-manager",
            effectiveManager,
          ],
        ],
      ];
    },
    notes: [
      "Angular enforces TypeScript and encourages feature modules plus standalone components.",
    ],
  },
  {
    id: "svelte",
    label: "SvelteKit",
    description:
      "Compiled UI with hybrid rendering and delightful transitions.",
    docs: "https://kit.svelte.dev",
    createCommand: ({ manager, project }) => {
      const lookup = {
        npm: ["npm", ["create", "svelte@latest", project]],
        pnpm: ["pnpm", ["create", "svelte@latest", project]],
        yarn: ["yarn", ["create", "svelte", project]],
        bun: ["bun", ["create", "svelte", project]],
      };
      return [lookup[manager]];
    },
    notes: [
      "Select the TypeScript+ESLint preset during the SvelteKit wizard for a polished DX.",
    ],
  },
];

export const stylingOptions = [
  {
    id: "tailwind",
    label: "Tailwind CSS",
    packages: {
      devDependencies: ["tailwindcss", "@tailwindcss/postcss", "postcss"],
    },
    notes: [
      "Equalizer wires up Tailwind with the PostCSS plugin and base stylesheet automatically.",
    ],
  },
  {
    id: "chakra",
    label: "Chakra UI",
    include: ["react"],
    packages: {
      dependencies: [
        "@chakra-ui/react",
        "@emotion/react",
        "@emotion/styled",
        "framer-motion",
      ],
    },
    notes: [
      "Wrap your app with `<ChakraProvider>` and define tokens under `theme.ts`.",
    ],
  },
  {
    id: "mui",
    label: "MUI",
    include: ["react"],
    packages: {
      dependencies: [
        "@mui/material",
        "@mui/icons-material",
        "@emotion/react",
        "@emotion/styled",
      ],
    },
    notes: [
      "Create a theme with `createTheme` and share it through `<ThemeProvider>`.",
    ],
  },
  {
    id: "styled-components",
    label: "styled-components",
    include: ["react"],
    packages: ({ useTypescript }) => ({
      dependencies: ["styled-components"],
      devDependencies: useTypescript ? ["@types/styled-components"] : [],
    }),
  },
  {
    id: "bootstrap",
    label: "Bootstrap 5",
    packages: {
      dependencies: ["bootstrap"],
    },
    notes: [
      'Import `"bootstrap/dist/css/bootstrap.min.css"` in your entry module to enable the toolkit.',
    ],
  },
  {
    id: "sass",
    label: "Sass / SCSS",
    packages: {
      devDependencies: ["sass"],
    },
  },
];

export const dataOptions = [
  {
    id: "axios",
    label: "Axios",
    packages: {
      dependencies: ["axios"],
    },
  },
  {
    id: "react-query",
    label: "TanStack Query",
    include: ["react"],
    packages: {
      dependencies: ["@tanstack/react-query"],
    },
    notes: [
      "Expose a shared QueryClient and wrap the app with `<QueryClientProvider>`.",
    ],
  },
  {
    id: "swr",
    label: "SWR",
    include: ["react"],
    packages: {
      dependencies: ["swr"],
    },
  },
  {
    id: "graphql-request",
    label: "graphql-request",
    packages: {
      dependencies: ["graphql-request", "graphql"],
    },
  },
  {
    id: "apollo-client",
    label: "Apollo Client",
    packages: {
      dependencies: ["@apollo/client", "graphql"],
    },
  },
];

export const stateOptions = [
  {
    id: "redux-toolkit",
    label: "Redux Toolkit",
    include: ["react"],
    packages: {
      dependencies: ["@reduxjs/toolkit", "react-redux"],
    },
  },
  {
    id: "zustand",
    label: "Zustand",
    include: ["react"],
    packages: {
      dependencies: ["zustand"],
    },
  },
  {
    id: "jotai",
    label: "Jotai",
    include: ["react"],
    packages: {
      dependencies: ["jotai"],
    },
  },
  {
    id: "mobx",
    label: "MobX",
    include: ["react"],
    packages: {
      dependencies: ["mobx", "mobx-react-lite"],
    },
  },
  {
    id: "xstate",
    label: "XState",
    packages: {
      dependencies: ["xstate"],
    },
  },
  {
    id: "pinia",
    label: "Pinia",
    include: ["vue"],
    packages: {
      dependencies: ["pinia"],
    },
  },
  {
    id: "ngrx",
    label: "NgRx",
    include: ["angular"],
    packages: {
      dependencies: ["@ngrx/store", "@ngrx/effects", "@ngrx/entity"],
    },
  },
];

export const toolingOptions = [
  {
    id: "eslint",
    label: "ESLint",
    packages: ({ framework, useTypescript }) => {
      const dev = new Set(["eslint"]);
      if (framework === "react") {
        dev.add("eslint-plugin-react");
        dev.add("eslint-plugin-react-hooks");
      }
      if (framework === "vue") {
        dev.add("eslint-plugin-vue");
      }
      if (framework === "svelte") {
        dev.add("eslint-plugin-svelte");
        dev.add("svelte-eslint-parser");
      }
      if (framework === "angular") {
        dev.add("@angular-eslint/eslint-plugin");
        dev.add("@angular-eslint/eslint-plugin-template");
        dev.add("@angular-eslint/template-parser");
      }
      if (useTypescript) {
        dev.add("@typescript-eslint/parser");
        dev.add("@typescript-eslint/eslint-plugin");
      }
      return { devDependencies: Array.from(dev) };
    },
    notes: ["Run `npx eslint --init` to scaffold the configuration file."],
  },
  {
    id: "prettier",
    label: "Prettier",
    packages: {
      devDependencies: ["prettier"],
    },
    notes: ["Create a `.prettierrc` file and wire it into your CI pipeline."],
  },
  {
    id: "organize-imports",
    label: "Organize imports on save",
    notes: [
      "Enable organize imports in your editor (VS Code: set \"editor.codeActionsOnSave\" to run \"source.organizeImports\").",
    ],
  },
  {
    id: "testing-library",
    label: "Testing Library",
    packages: ({ framework, useTypescript }) => {
      const dev = ["@testing-library/user-event"];
      if (framework === "react") {
        dev.push("@testing-library/react", "@testing-library/jest-dom");
        if (useTypescript) {
          dev.push("@types/testing-library__jest-dom");
        }
      }
      if (framework === "vue") {
        dev.push("@testing-library/vue", "@testing-library/jest-dom");
      }
      if (framework === "svelte") {
        dev.push("@testing-library/svelte");
      }
      if (framework === "angular") {
        dev.push("@testing-library/angular");
      }
      return { devDependencies: dev };
    },
  },
  {
    id: "vitest",
    label: "Vitest",
    exclude: ["angular"],
    packages: {
      devDependencies: ["vitest", "@vitest/ui", "jsdom"],
    },
  },
  {
    id: "cypress",
    label: "Cypress",
    packages: {
      devDependencies: ["cypress"],
    },
  },
  {
    id: "playwright",
    label: "Playwright",
    packages: {
      devDependencies: ["@playwright/test"],
    },
  },
  {
    id: "msw",
    label: "MSW",
    packages: {
      devDependencies: ["msw"],
    },
    notes: [
      "Build request handlers inside `src/mocks` and boot them in tests.",
    ],
  },
  {
    id: "storybook",
    label: "Storybook",
    notes: [
      "Run `npx storybook@latest init` with the suggested flags for your framework.",
    ],
  },
];

export const selectionCategories = ["styling", "data", "state", "tooling"];
export const singleChoiceCategories = ["styling", "data", "state"];
