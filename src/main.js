import process from "node:process";

import { intro, note, log } from "@clack/prompts";
import pc from "picocolors";

import { gatherConfigViaCli, summarizeBlueprint, farewell } from "./prompts.js";
import { scaffoldProject } from "./actions.js";
import { frameworkMap, packageManagerMap, optionMap } from "./blueprint.js";
import { logDivider, formatCommand, bindInterruptHandler } from "./utils.js";
import { selectionCategories } from "./options.js";

const renderBanner = () => {
  const art = pc.cyan(`
 __ _     _    ______ __ _ 
|_ / \\| ||_||   |  _/|_ |_)
|__\\_X|_|| ||___|_/__|__| \\                                  
`);
  process.stdout.write(
    `${art}\n${pc.magenta(pc.bold("Compose modern stacks in minutes."))}\n`
  );
};

export const run = async () => {
  bindInterruptHandler();
  intro(pc.bold(pc.magenta("Equalizer Front Kit")));
  renderBanner();
  note(
    "Use arrow keys and space to toggle options. Press Enter any time to skip a category.",
    pc.cyan("Navigation Tips")
  );

  const config = await gatherConfigViaCli();

  const { aggregation, architecture } = summarizeBlueprint(config);
  const scaffold = await scaffoldProject(config, aggregation);

  logDivider("Blueprint summary");
  const framework = frameworkMap[config.framework];
  const manager = packageManagerMap[config.packageManager];

  log.info(`${pc.bold("Project directory")} ${pc.dim(scaffold.projectDir)}`);
  log.info(`${pc.bold("Framework")} ${pc.dim(framework.label)}`);
  log.info(`${pc.bold("Package manager")} ${pc.dim(manager.label)}`);
  log.info(
    `${pc.bold("Language")} ${pc.dim(config.useTypescript ? "TypeScript" : "JavaScript")}`
  );

  process.stdout.write(`\n${pc.bold("Scaffold commands")}\n`);
  scaffold.createCommands.forEach(({ cmd, args }) => {
    process.stdout.write(`  ${pc.blue("-")} ${formatCommand(cmd, args)}\n`);
  });

  process.stdout.write(`\n${pc.bold("Runtime install")}\n`);
  if (scaffold.runtimeCommand) {
    process.stdout.write(
      `  ${pc.green("-")} ${pc.dim(scaffold.runtimeCommand)}\n`
    );
  } else {
    process.stdout.write(
      `  ${pc.yellow("-")} ${pc.dim("No additional runtime dependencies")}\n`
    );
  }

  if (scaffold.devCommand) {
    process.stdout.write(`\n${pc.bold("Dev install")}\n`);
    process.stdout.write(`  ${pc.green("-")} ${pc.dim(scaffold.devCommand)}\n`);
  }

  if (aggregation.notes.length) {
    process.stdout.write(`\n${pc.bold("Follow-up tasks")}\n`);
    aggregation.notes.forEach((task) =>
      process.stdout.write(`  ${pc.magenta("-")} ${pc.dim(task)}\n`)
    );
  }

  process.stdout.write(`\n${pc.bold("Suggested architecture")}\n`);
  architecture.forEach((line) => process.stdout.write(`  ${pc.dim(line)}\n`));

  process.stdout.write(`\n${pc.bold("Selections")}\n`);
  selectionCategories.forEach((category) => {
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    const picked = config[category];
    if (!picked.length) {
      process.stdout.write(`  ${pc.gray(label)}: ${pc.dim("none")}\n`);
      return;
    }
    const resolved = picked.map((id) => optionMap[id]?.label ?? id).join(", ");
    process.stdout.write(`  ${pc.gray(label)}: ${pc.dim(resolved)}\n`);
  });

  farewell();
};
