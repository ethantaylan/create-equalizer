import { spawn } from "node:child_process";
import process from "node:process";

import pc from "picocolors";

let activeSpinner = null;
let interruptBound = false;

export const registerSpinner = (instance) => {
  activeSpinner = instance;
  return () => {
    if (activeSpinner === instance) {
      activeSpinner = null;
    }
  };
};

export const stopActiveSpinner = (message = pc.red("[cancelled]")) => {
  if (activeSpinner) {
    try {
      activeSpinner.stop(message);
    } catch {
      // ignore spinner stop errors
    } finally {
      activeSpinner = null;
    }
  }
};

export const bindInterruptHandler = () => {
  if (interruptBound) return;
  interruptBound = true;
  process.on("SIGINT", () => {
    stopActiveSpinner();
    process.stdout.write(`\n${pc.red("[cancelled] Installation aborted by user.")}\n`);
    process.exit(1);
  });
};

export const ensure = (value) => {
  if (value === Symbol.for("clack:cancel")) {
    stopActiveSpinner();
    process.stdout.write(`${pc.red("[cancelled] Setup stopped.")}\n`);
    process.exit(0);
  }
  return value;
};

export const run = (cmd, args, cwd, options = {}) =>
  new Promise((resolve, reject) => {
    const stdio =
      options.input !== undefined ? ["pipe", "inherit", "inherit"] : "inherit";
    const child = spawn(cmd, args, {
      cwd,
      stdio,
      shell: process.platform === "win32",
      env: { ...process.env, ...(options.env ?? {}) },
    });
    if (options.input !== undefined && child.stdin) {
      child.stdin.write(options.input);
      child.stdin.end();
    }
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(" ")} failed`));
      }
    });
  });

export const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "my-app";

export const getInstallTuple = (manager, packages, dev) => {
  if (!packages.length) return null;
  if (manager === "npm") {
    return ["npm", ["install", ...(dev ? ["--save-dev"] : []), ...packages]];
  }
  if (manager === "pnpm") {
    return ["pnpm", ["add", ...(dev ? ["-D"] : []), ...packages]];
  }
  if (manager === "yarn") {
    return ["yarn", ["add", ...(dev ? ["--dev"] : []), ...packages]];
  }
  return ["bun", ["add", ...(dev ? ["-d"] : []), ...packages]];
};

export const buildInstallCommand = (manager, packages, dev) => {
  const tuple = getInstallTuple(manager, packages, dev);
  if (!tuple) return null;
  return [tuple[0], ...tuple[1]].join(" ");
};

export const logDivider = (title) => {
  const line = pc.dim("=".repeat(60));
  process.stdout.write(`\n${line}\n${pc.bold(pc.cyan(title))}\n${line}\n`);
};

export const formatCommand = (cmd, args) =>
  pc.dim(`${cmd} ${args.map((part) => (part.includes(" ") ? `"${part}"` : part)).join(" ")}`);
