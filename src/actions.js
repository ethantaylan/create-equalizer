import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

import { spinner, log } from "@clack/prompts";
import pc from "picocolors";

import { frameworkMap } from "./blueprint.js";
import {
  getInstallTuple,
  run,
  logDivider,
  buildInstallCommand,
  formatCommand,
  registerSpinner,
} from "./utils.js";

const tailwindTuples = {
  npm: () => ["npx", ["tailwindcss", "init"]],
  pnpm: () => ["pnpm", ["dlx", "tailwindcss", "init"]],
  yarn: () => ["yarn", ["dlx", "tailwindcss", "init"]],
  bun: () => ["bunx", ["tailwindcss", "init"]],
};

const runWithSpinner = async (title, cmd, args, cwd) => {
  const s = spinner();
  const release = registerSpinner(s);
  const display = `${title} ${formatCommand(cmd, args)}`;
  s.start(display);
  try {
    await run(cmd, args, cwd);
    s.stop(pc.green(`[done] ${title}`));
  } catch (error) {
    s.stop(pc.red(`[failed] ${title}`));
    throw error;
  } finally {
    release();
  }
};

const tailwindConfigCandidates = [
  "tailwind.config.ts",
  "tailwind.config.js",
  "tailwind.config.mjs",
  "tailwind.config.cjs",
];

const entryCandidates = [
  "src/main.tsx",
  "src/main.jsx",
  "src/main.ts",
  "src/main.js",
];

const postcssConfigCandidates = [
  "postcss.config.ts",
  "postcss.config.js",
  "postcss.config.mjs",
  "postcss.config.cjs",
];

const appComponentCandidates = ["src/App.tsx", "src/App.jsx"];

const appStylesCandidates = ["src/App.css", "src/app.css"];

const findFirstExisting = (projectDir, candidates) => {
  for (const candidate of candidates) {
    const resolved = join(projectDir, candidate);
    if (existsSync(resolved)) {
      return resolved;
    }
  }
  return null;
};

const ensureTailwindConfig = async (projectDir) => {
  const configPath =
    findFirstExisting(projectDir, tailwindConfigCandidates) ??
    join(projectDir, "tailwind.config.js");
  const isCjs = configPath.endsWith(".cjs");
  const template = isCjs
    ? `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue,svelte}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
`
    : `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue,svelte}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
  await writeFile(configPath, template);
};

const ensurePostcssConfig = async (projectDir) => {
  const configPath =
    findFirstExisting(projectDir, postcssConfigCandidates) ??
    join(projectDir, "postcss.config.js");
  const isCjs = configPath.endsWith(".cjs");
  const template = isCjs
    ? `module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`
    : `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`;
  await writeFile(configPath, template);
};

const ensureTailwindBaseStyles = async (projectDir) => {
  const entryPath = findFirstExisting(projectDir, entryCandidates);
  if (!entryPath) return;

  const entrySource = await readFile(entryPath, "utf8");
  const cssImport = entrySource.match(/import\s+["'](\.\/.*\.css)["'];?/);
  if (!cssImport) return;

  const cssPath = resolve(dirname(entryPath), cssImport[1]);
  if (!existsSync(cssPath)) return;

  const stylesheet = await readFile(cssPath, "utf8");
  if (
    stylesheet.includes("@tailwind") ||
    stylesheet.includes('@import "tailwindcss"') ||
    stylesheet.includes("@import 'tailwindcss'")
  ) {
    return;
  }

  await writeFile(cssPath, '@import "tailwindcss";\n');
};

const clearAppStyles = async (projectDir) => {
  const stylesPath = findFirstExisting(projectDir, appStylesCandidates);
  if (!stylesPath) return;
  await writeFile(stylesPath, "");
};

const injectEqualizerShowcase = async (projectDir) => {
  const componentPath = findFirstExisting(projectDir, appComponentCandidates);
  if (!componentPath) return;
  const isTsx = componentPath.endsWith(".tsx");
  const channelsDeclaration = isTsx
    ? "const channels: number[] = [12, 20, 14, 26, 18, 22]"
    : "const channels = [12, 20, 14, 26, 18, 22]";
  const formatterDeclaration = isTsx
    ? "const formatChannelLabel = (index: number): string => `CH ${String(index + 1).padStart(2, '0')}`"
    : "const formatChannelLabel = (index) => `CH ${String(index + 1).padStart(2, '0')}`";
  const template = `import './App.css'

${channelsDeclaration}
${formatterDeclaration}

${isTsx ? "function App(): JSX.Element" : "function App()"} {
  return (
   <div
  className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-6"
>
  <div
    className="relative w-full max-w-3xl rounded-[2.5rem] border border-slate-800/80 bg-slate-900/60 p-10 shadow-[0_25px_80px_-20px_rgba(56,189,248,0.55)] backdrop-blur"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.45em] text-sky-400/80">
          Equalizer
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">
          Front-End Kit generator
        </h1>
      </div>
    </div>
  </div>
</div>

  )
}

export default App
`;
  await writeFile(componentPath, template);
};

const configureTailwind = async (projectDir) => {
  await ensureTailwindConfig(projectDir);
  await ensurePostcssConfig(projectDir);
  await ensureTailwindBaseStyles(projectDir);
  await clearAppStyles(projectDir);
  await injectEqualizerShowcase(projectDir);
};

export const scaffoldProject = async (config, aggregation) => {
  const framework = frameworkMap[config.framework];
  const createSteps = framework.createCommand({
    manager: config.packageManager,
    useTypescript: config.useTypescript,
    project: config.projectName,
  });

  logDivider("Scaffolding");
  for (const [cmd, args] of createSteps) {
    await runWithSpinner(pc.cyan("Creating project"), cmd, args, process.cwd());
  }

  const projectDir = resolve(process.cwd(), config.projectName);
  log.info(`${pc.bold("Project directory")} ${pc.dim(projectDir)}`);

  if (config.framework !== "angular") {
    await runWithSpinner(
      pc.cyan("Installing base dependencies"),
      config.packageManager,
      ["install"],
      projectDir
    );
  }

  const runtimeTuple = getInstallTuple(
    config.packageManager,
    aggregation.dependencies,
    false
  );
  if (runtimeTuple) {
    await runWithSpinner(
      pc.cyan("Installing runtime libraries"),
      runtimeTuple[0],
      runtimeTuple[1],
      projectDir
    );
  } else {
    log.info(pc.yellow("No additional runtime dependencies selected"));
  }

  const devTuple = getInstallTuple(
    config.packageManager,
    aggregation.devDependencies,
    true
  );
  if (devTuple) {
    await runWithSpinner(
      pc.cyan("Installing dev tooling"),
      devTuple[0],
      devTuple[1],
      projectDir
    );
  } else {
    log.info(pc.yellow("No additional dev dependencies selected"));
  }

  if (config.styling.includes("tailwind") && config.framework !== "angular") {
    const tupleFactory =
      tailwindTuples[config.packageManager] ?? tailwindTuples.npm;
    const [cmd, args] = tupleFactory();
    await runWithSpinner(
      pc.cyan("Initializing Tailwind CSS"),
      cmd,
      args,
      projectDir
    );
    await configureTailwind(projectDir);
  }

  log.success(pc.green("Scaffolding complete!"));

  return {
    projectDir,
    createCommands: createSteps.map(([cmd, args]) => ({ cmd, args })),
    runtimeCommand: buildInstallCommand(
      config.packageManager,
      aggregation.dependencies,
      false
    ),
    devCommand: buildInstallCommand(
      config.packageManager,
      aggregation.devDependencies,
      true
    ),
  };
};
