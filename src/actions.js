import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

import { spinner, log } from "@clack/prompts";
import pc from "picocolors";

import { frameworkMap, packageManagerMap, optionMap } from "./blueprint.js";
import {
  getInstallTuple,
  run,
  logDivider,
  buildInstallCommand,
  formatCommand,
  registerSpinner,
} from "./utils.js";

const runWithSpinner = async (title, cmd, args, cwd, options) => {
  const s = spinner();
  const release = registerSpinner(s);
  const display = `${title} ${formatCommand(cmd, args)}`;
  s.start(display);
  try {
    await run(cmd, args, cwd, options);
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

const buildSpecSheet = (config) => {
  const specs = [];
  const pushEntry = (label, value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      if (!value.length) return;
      specs.push({ label, value: value.join(", ") });
      return;
    }
    specs.push({ label, value });
  };

  const framework = frameworkMap[config.framework];
  const manager = packageManagerMap[config.packageManager];

  pushEntry("Framework", framework?.label ?? config.framework);
  pushEntry("Language", config.useTypescript ? "TypeScript" : "JavaScript");
  pushEntry("Package manager", manager?.label ?? config.packageManager);

  const mapOptionLabels = (ids = []) =>
    ids
      .map((id) => optionMap[id]?.label ?? id)
      .filter(Boolean);

  pushEntry("Styling", mapOptionLabels(config.styling));
  pushEntry("Data", mapOptionLabels(config.data));
  pushEntry("State", mapOptionLabels(config.state));
  pushEntry("Tooling", mapOptionLabels(config.tooling));

  return specs;
};

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

const ensureOrganizeImportsSetting = async (projectDir) => {
  const vscodeDir = join(projectDir, ".vscode");
  const settingsPath = join(vscodeDir, "settings.json");
  await mkdir(vscodeDir, { recursive: true });

  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      const existing = await readFile(settingsPath, "utf8");
      settings = JSON.parse(existing || "{}");
    } catch {
      settings = {};
    }
  }

  const codeActions =
    settings["editor.codeActionsOnSave"] &&
    typeof settings["editor.codeActionsOnSave"] === "object" &&
    !Array.isArray(settings["editor.codeActionsOnSave"])
      ? settings["editor.codeActionsOnSave"]
      : {};

  const nextSettings = {
    ...settings,
    "editor.codeActionsOnSave": {
      ...codeActions,
      "source.organizeImports": "always",
    },
  };

  await writeFile(settingsPath, `${JSON.stringify(nextSettings, null, 2)}\n`);
};

const injectEqualizerShowcase = async (projectDir, config) => {
  const componentPath = findFirstExisting(projectDir, appComponentCandidates);
  if (!componentPath) return;
  const isTsx = componentPath.endsWith(".tsx");
  const specSheet = buildSpecSheet(config);
  const projectNameLiteral = JSON.stringify(config.projectName);
  const specLiteral = JSON.stringify(specSheet, null, 2);
  const template = `import './App.css'

const projectName = ${projectNameLiteral};
const specs = ${specLiteral};

${isTsx ? "function App(): JSX.Element" : "function App()"} {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8 rounded-[2.5rem] border border-white/10 bg-white/5 p-10 shadow-[0_35px_120px_-30px_rgba(56,189,248,0.4)] backdrop-blur">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.6em] text-sky-400/80">
            Equalizer Spec Sheet
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-white">
              {projectName}
            </h1>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
              Configured
            </span>
          </div>
          <p className="text-sm text-slate-400">
            A quick snapshot of the stack and tooling you selected.
          </p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          {specs.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/40"
            >
              <dt className="text-xs uppercase tracking-[0.35em] text-slate-400">
                {item.label}
              </dt>
              <dd className="mt-2 text-base font-medium text-white">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>

  )
}

export default App
`;
  await writeFile(componentPath, template);
};

const configureTailwind = async (projectDir, config) => {
  await ensureTailwindConfig(projectDir);
  await ensurePostcssConfig(projectDir);
  await ensureTailwindBaseStyles(projectDir);
  await clearAppStyles(projectDir);
  await injectEqualizerShowcase(projectDir, config);
};

export const scaffoldProject = async (config, aggregation) => {
  const framework = frameworkMap[config.framework];
  const createSteps = framework.createCommand({
    manager: config.packageManager,
    useTypescript: config.useTypescript,
    project: config.projectName,
  });

  logDivider("Scaffolding");
  for (const step of createSteps) {
    const [cmd, args, execOptions] = step;
    await runWithSpinner(
      pc.cyan("Creating project"),
      cmd,
      args,
      process.cwd(),
      execOptions
    );
  }

  const projectDir = resolve(process.cwd(), config.projectName);
  log.info(`${pc.bold("Project directory")} ${pc.dim(projectDir)}`);

  await runWithSpinner(
    pc.cyan("Installing base dependencies"),
    config.packageManager,
    ["install"],
    projectDir
  );

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

  if (config.styling.includes("tailwind")) {
    log.info(pc.cyan("Configuring Tailwind CSS"));
    await configureTailwind(projectDir, config);
    log.info(pc.green("Tailwind CSS configured"));
  }

  if (config.tooling.includes("organize-imports")) {
    log.info(pc.cyan("Enabling organize imports on save for VS Code"));
    await ensureOrganizeImportsSetting(projectDir);
    log.info(pc.green("VS Code organize imports configured"));
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
