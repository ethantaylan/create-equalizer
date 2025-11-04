import { intro } from "@clack/prompts";
import process from "node:process";

import {
  promptExperience,
  gatherConfigViaCli,
  summarizeBlueprint,
  farewell,
} from "./prompts.js";
import { collectConfigViaUi } from "./ui-server.js";
import { scaffoldProject } from "./actions.js";
import { frameworkMap, packageManagerMap, optionMap } from "./blueprint.js";
import { logDivider } from "./utils.js";
import { selectionCategories } from "./options.js";

export const run = async () => {
  intro("Equalizer Front Kit");
  const experience = await promptExperience();
  const config =
    experience === "cli"
      ? await gatherConfigViaCli()
      : await collectConfigViaUi();

  const { aggregation, architecture } = summarizeBlueprint(config);
  const scaffold = await scaffoldProject(config, aggregation);

  logDivider("Blueprint summary");
  const framework = frameworkMap[config.framework];
  const manager = packageManagerMap[config.packageManager];

  process.stdout.write(`\nProject directory: ${scaffold.projectDir}\n`);
  process.stdout.write(`Framework: ${framework.label}\n`);
  process.stdout.write(`Package manager: ${manager.label}\n`);
  process.stdout.write(
    `Language: ${config.useTypescript ? "TypeScript" : "JavaScript"}\n`
  );

  process.stdout.write("\nScaffold commands:\n");
  scaffold.createCommands.forEach((command) => {
    process.stdout.write(`  ${command}\n`);
  });

  if (scaffold.runtimeCommand) {
    process.stdout.write(`\nRuntime install:\n  ${scaffold.runtimeCommand}\n`);
  } else {
    process.stdout.write(
      "\nRuntime install:\n  (no additional runtime dependencies)\n"
    );
  }
  if (scaffold.devCommand) {
    process.stdout.write(`Dev install:\n  ${scaffold.devCommand}\n`);
  }

  if (aggregation.notes.length) {
    process.stdout.write("\nFollow-up tasks:\n");
    aggregation.notes.forEach((note) => process.stdout.write(`  - ${note}\n`));
  }

  process.stdout.write("\nSuggested architecture:\n");
  architecture.forEach((line) => process.stdout.write(`  ${line}\n`));

  process.stdout.write("\nSelections:\n");
  selectionCategories.forEach((category) => {
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    const heard = config[category];
    if (!heard.length) {
      process.stdout.write(`  ${label}: none\n`);
      return;
    }
    const resolved = heard.map((id) => optionMap[id]?.label ?? id).join(", ");
    process.stdout.write(`  ${label}: ${resolved}\n`);
  });

  farewell();
};
