import { multiselect, outro, select, text } from "@clack/prompts";

import {
  packageManagers,
  stylingOptions,
  dataOptions,
  stateOptions,
  toolingOptions,
  singleChoiceCategories,
} from "./options.js";
import {
  isOptionSupported,
  sanitizeSelections,
  aggregateSelections,
  buildArchitecture,
} from "./blueprint.js";
import { ensure, slugify } from "./utils.js";

const singleChoiceSet = new Set(singleChoiceCategories);

const askBoolean = async (message, initialValue = true) =>
  ensure(
    await select({
      message,
      options: [
        { value: true, label: "Yes" },
        { value: false, label: "No" },
      ],
      initialValue: initialValue ? true : false,
    })
  );

const buildSkipValue = (category) => `__skip_${category}__`;

const promptForCategory = async (category, options, framework) => {
  const filtered = options.filter((option) =>
    isOptionSupported(option, framework)
  );
  if (!filtered.length) {
    return [];
  }

  const isSingleChoice = singleChoiceSet.has(category);
  const message = buildCategoryMessage(category, isSingleChoice);
  if (isSingleChoice) {
    const skipValue = buildSkipValue(category);
    const selection = ensure(
      await select({
        message,
        options: [
          { value: skipValue, label: "None" },
          ...filtered.map((option) => ({
            value: option.id,
            label: option.label,
            hint: option.description,
          })),
        ],
        initialValue: skipValue,
      })
    );
    return selection === skipValue ? [] : [selection];
  }

  return ensure(
    await multiselect({
      message,
      options: filtered.map((option) => ({
        value: option.id,
        label: option.label,
        hint: option.description,
      })),
      initialValues: [],
      required: false,
    })
  );
};

const buildCategoryMessage = (category, isSingleChoice) => {
  const navigation = isSingleChoice
    ? "(arrow keys to highlight, Enter to choose or skip)"
    : "(spacebar to select, Enter to skip)";
  switch (category) {
    case "styling":
      return `Pick the design system and styling layers: ${navigation}`;
    case "data":
      return `Choose the data fetching strategy: ${navigation}`;
    case "state":
      return `Choose the state management tools: ${navigation}`;
    case "tooling":
      return `Select the quality tooling: ${navigation}`;
    default:
      return `Select options: ${navigation}`;
  }
};

export const gatherConfigViaCli = async () => {
  const projectInput = ensure(
    await text({
      message: "Project name",
      placeholder: "my-app",
      defaultValue: "my-app",
    })
  );
  const projectName = slugify(projectInput || "my-app");

  const packageManager = ensure(
    await select({
      message: "Choose your package manager (be sure it's installed)",
      options: packageManagers.map((manager) => ({
        value: manager.id,
        label: manager.label,
        hint: manager.description,
      })),
      initialValue: "pnpm",
    })
  );

  const framework = "react";

  const useTypescript = await askBoolean("Do you want TypeScript?", true);

  const styling = await promptForCategory("styling", stylingOptions, framework);
  const data = await promptForCategory("data", dataOptions, framework);
  const state = await promptForCategory("state", stateOptions, framework);
  const tooling = await promptForCategory("tooling", toolingOptions, framework);

  const selections = sanitizeSelections(
    {
      styling,
      data,
      state,
      tooling,
    },
    framework
  );

  return {
    mode: "cli",
    projectName,
    packageManager,
    framework,
    useTypescript,
    ...selections,
  };
};

export const summarizeBlueprint = (config) => {
  const context = {
    framework: config.framework,
    useTypescript: config.useTypescript,
  };
  const aggregation = aggregateSelections(
    {
      styling: config.styling,
      data: config.data,
      state: config.state,
      tooling: config.tooling,
    },
    context
  );
  const architecture = buildArchitecture(
    config.framework,
    config.styling.includes("tailwind")
  );
  return { aggregation, architecture };
};

export const farewell = () => {
  outro("Setup complete. Happy building!");
};
