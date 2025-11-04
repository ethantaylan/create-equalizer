import { multiselect, outro, select, text } from "@clack/prompts";

import {
  frameworks,
  packageManagers,
  stylingOptions,
  dataOptions,
  stateOptions,
  toolingOptions,
  selectionCategories,
} from "./options.js";
import {
  frameworkMap,
  isOptionSupported,
  sanitizeSelections,
  aggregateSelections,
  buildArchitecture,
} from "./blueprint.js";
import { ensure, slugify } from "./utils.js";

const defaultSelections = {
  styling: ["tailwind"],
  data: ["axios"],
  state: ["redux-toolkit"],
  tooling: ["eslint", "prettier", "testing-library"],
};

export const promptExperience = async () =>
  ensure(
    await select({
      message: "How would you like to configure Equalizer?",
      options: [
        { value: "cli", label: "Use the interactive CLI wizard" },
        { value: "ui", label: "Open the Equalizer web assistant (browser)" },
      ],
      initialValue: "cli",
    }),
  );

const askBoolean = async (message, initialValue = true) =>
  ensure(
    await select({
      message,
      options: [
        { value: true, label: "Yes" },
        { value: false, label: "No" },
      ],
      initialValue: initialValue ? true : false,
    }),
  );

const promptForCategory = async (category, options, framework, initialValues = []) => {
  const filtered = options.filter((option) => isOptionSupported(option, framework));
  if (!filtered.length) {
    return [];
  }
  return ensure(
    await multiselect({
      message: buildCategoryMessage(category),
      options: filtered.map((option) => ({
        value: option.id,
        label: option.label,
        hint: option.description,
      })),
      initialValues: initialValues.filter((value) =>
        filtered.some((option) => option.id === value),
      ),
    }),
  );
};

const buildCategoryMessage = (category) => {
  switch (category) {
    case "styling":
      return "Pick the design system and styling layers: (spacebar to select)";
    case "data":
      return "Choose the data fetching strategy: (spacebar to select)";
    case "state":
      return "Choose the state management tools: (spacebar to select)";
    case "tooling":
      return "Select the quality tooling: (spacebar to select)";
    default:
      return "Select options:";
  }
};

export const gatherConfigViaCli = async () => {
  const projectInput = ensure(
    await text({
      message: "Project name",
      placeholder: "my-app",
      defaultValue: "my-app",
    }),
  );
  const projectName = slugify(projectInput || "my-app");

  const packageManager = ensure(
    await select({
      message: "Choose your package manager",
      options: packageManagers.map((manager) => ({
        value: manager.id,
        label: manager.label,
        hint: manager.description,
      })),
      initialValue: "pnpm",
    }),
  );

  const framework = ensure(
    await select({
      message: "Select your framework",
      options: frameworks.map((framework) => ({
        value: framework.id,
        label: framework.label,
        hint: framework.description,
      })),
      initialValue: "react",
    }),
  );

  let useTypescript = framework === "angular";
  if (framework !== "angular") {
    useTypescript = await askBoolean("Do you want TypeScript?", true);
  }

  const styling = await promptForCategory(
    "styling",
    stylingOptions,
    framework,
    defaultSelections.styling,
  );
  const data = await promptForCategory(
    "data",
    dataOptions,
    framework,
    defaultSelections.data,
  );
  const stateDefaults = framework === "react" ? defaultSelections.state : [];
  const state = await promptForCategory("state", stateOptions, framework, stateDefaults);
  const tooling = await promptForCategory(
    "tooling",
    toolingOptions,
    framework,
    defaultSelections.tooling,
  );

  const selections = sanitizeSelections(
    {
      styling,
      data,
      state,
      tooling,
    },
    framework,
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
    context,
  );
  const architecture = buildArchitecture(
    config.framework,
    config.styling.includes("tailwind"),
  );
  return { aggregation, architecture };
};

export const farewell = () => {
  outro("Setup complete. Happy building!");
};
