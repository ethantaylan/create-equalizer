import {
  frameworks,
  packageManagers,
  stylingOptions,
  dataOptions,
  stateOptions,
  toolingOptions,
  selectionCategories,
} from "./options.js";

export const optionMap = [
  ...stylingOptions,
  ...dataOptions,
  ...stateOptions,
  ...toolingOptions,
].reduce((acc, option) => {
  acc[option.id] = option;
  return acc;
}, {});

export const frameworkMap = frameworks.reduce((acc, framework) => {
  acc[framework.id] = framework;
  return acc;
}, {});

export const packageManagerMap = packageManagers.reduce((acc, manager) => {
  acc[manager.id] = manager;
  return acc;
}, {});

export const isOptionSupported = (option, framework) => {
  if (option.include && !option.include.includes(framework)) {
    return false;
  }
  if (option.exclude && option.exclude.includes(framework)) {
    return false;
  }
  return true;
};

export const sanitizeSelections = (selections, framework) => {
  const next = {};
  selectionCategories.forEach((category) => {
    next[category] = (selections[category] ?? []).filter((id) => {
      const option = optionMap[id];
      return option ? isOptionSupported(option, framework) : false;
    });
  });
  return next;
};

export const buildArchitecture = (framework, useTailwind) => {
  const lines = ["project/", "|-- public/", "|-- src/"];
  lines.push(
    "|   |-- app/",
    "|   |   |-- layout/",
    "|   |   `-- routes/",
    "|   |-- components/",
    "|   |-- features/"
  );
  lines.push("|   |-- lib/", "|   |-- services/");
  lines.push(
    useTailwind
      ? "|   |-- styles/ (tailwind.css, tokens, utilities)"
      : "|   |-- styles/"
  );
  lines.push("|   `-- tests/", "|-- scripts/", "`-- docs/");
  return lines;
};

export const aggregateSelections = (selections, context) => {
  const dependencies = new Set();
  const devDependencies = new Set();
  const notes = new Set();

  const addOption = (option) => {
    if (!isOptionSupported(option, context.framework)) {
      return;
    }
    const spec =
      typeof option.packages === "function"
        ? option.packages(context)
        : option.packages;
    spec?.dependencies?.forEach((dep) => dep && dependencies.add(dep));
    spec?.devDependencies?.forEach((dep) => dep && devDependencies.add(dep));
    const optionNotes =
      typeof option.notes === "function"
        ? option.notes(context)
        : (option.notes ?? []);
    optionNotes.forEach((note) => note && notes.add(note));
  };

  selectionCategories.forEach((category) => {
    (selections[category] ?? []).forEach((id) => {
      const option = optionMap[id];
      if (option) addOption(option);
    });
  });

  return {
    dependencies: Array.from(dependencies).sort(),
    devDependencies: Array.from(devDependencies).sort(),
    notes: Array.from(notes),
  };
};
