import { spawn, exec } from "node:child_process";
import process from "node:process";

export const ensure = (value) => {
  if (value === Symbol.for("clack:cancel")) {
    process.stdout.write("Setup cancelled.\n");
    process.exit(0);
  }
  return value;
};

export const run = (cmd, args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(" ")} failed`));
      }
    });
  });

export const openBrowser = (url) =>
  new Promise((resolve) => {
    const command =
      process.platform === "darwin"
        ? `open "${url}"`
        : process.platform === "win32"
          ? `start "" "${url}"`
          : `xdg-open "${url}"`;
    exec(command, () => resolve());
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
  const line = "-".repeat(60);
  process.stdout.write(`\n${line}\n${title}\n${line}\n`);
};
