import { resolve } from "node:path";
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
  npm: (cwd) => ["npx", ["tailwindcss", "init", "-p", "--cwd", cwd]],
  pnpm: (cwd) => ["pnpm", ["dlx", "tailwindcss", "init", "-p", "--cwd", cwd]],
  yarn: (cwd) => ["yarn", ["dlx", "tailwindcss", "init", "-p", "--cwd", cwd]],
  bun: (cwd) => ["bunx", ["tailwindcss", "init", "-p", "--cwd", cwd]],
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
      projectDir,
    );
  }

  const runtimeTuple = getInstallTuple(
    config.packageManager,
    aggregation.dependencies,
    false,
  );
  if (runtimeTuple) {
    await runWithSpinner(
      pc.cyan("Installing runtime libraries"),
      runtimeTuple[0],
      runtimeTuple[1],
      projectDir,
    );
  } else {
    log.info(pc.yellow("No additional runtime dependencies selected"));
  }

  const devTuple = getInstallTuple(config.packageManager, aggregation.devDependencies, true);
  if (devTuple) {
    await runWithSpinner(
      pc.cyan("Installing dev tooling"),
      devTuple[0],
      devTuple[1],
      projectDir,
    );
  } else {
    log.info(pc.yellow("No additional dev dependencies selected"));
  }

  if (config.styling.includes("tailwind") && config.framework !== "angular") {
    const tupleFactory = tailwindTuples[config.packageManager] ?? tailwindTuples.npm;
    const [cmd, args] = tupleFactory(projectDir);
    await runWithSpinner(pc.cyan("Initializing Tailwind CSS"), cmd, args, projectDir);
  }

  log.success(pc.green("Scaffolding complete!"));

  return {
    projectDir,
    createCommands: createSteps.map(([cmd, args]) => ({ cmd, args })),
    runtimeCommand: buildInstallCommand(
      config.packageManager,
      aggregation.dependencies,
      false,
    ),
    devCommand: buildInstallCommand(config.packageManager, aggregation.devDependencies, true),
  };
};
