import { resolve } from "node:path";
import process from "node:process";

import { frameworkMap } from "./blueprint.js";
import { getInstallTuple, run, logDivider, buildInstallCommand } from "./utils.js";

const tailwindTuples = {
  npm: (cwd) => ["npx", ["tailwindcss", "init", "-p", "--cwd", cwd]],
  pnpm: (cwd) => ["pnpm", ["dlx", "tailwindcss", "init", "-p", "--cwd", cwd]],
  yarn: (cwd) => ["yarn", ["dlx", "tailwindcss", "init", "-p", "--cwd", cwd]],
  bun: (cwd) => ["bunx", ["tailwindcss", "init", "-p", "--cwd", cwd]],
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
    await run(cmd, args, process.cwd());
  }

  const projectDir = resolve(process.cwd(), config.projectName);

  if (config.framework !== "angular") {
    await run(config.packageManager, ["install"], projectDir);
  }

  const runtimeTuple = getInstallTuple(
    config.packageManager,
    aggregation.dependencies,
    false,
  );
  if (runtimeTuple) {
    await run(runtimeTuple[0], runtimeTuple[1], projectDir);
  }

  const devTuple = getInstallTuple(config.packageManager, aggregation.devDependencies, true);
  if (devTuple) {
    await run(devTuple[0], devTuple[1], projectDir);
  }

  if (config.styling.includes("tailwind") && config.framework !== "angular") {
    const tupleFactory = tailwindTuples[config.packageManager] ?? tailwindTuples.npm;
    const [cmd, args] = tupleFactory(projectDir);
    await run(cmd, args, projectDir);
  }

  return {
    projectDir,
    createCommands: createSteps.map(([cmd, args]) => [cmd, ...args].join(" ")),
    runtimeCommand: buildInstallCommand(
      config.packageManager,
      aggregation.dependencies,
      false,
    ),
    devCommand: buildInstallCommand(config.packageManager, aggregation.devDependencies, true),
  };
};
