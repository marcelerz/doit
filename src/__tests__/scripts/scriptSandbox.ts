import { spawnSync, SpawnSyncReturns } from "child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Runs the repository's scripts against a throwaway directory.
 *
 * The scripts resolve everything from their own location, so running them in
 * place would act on this checkout -- setup-hooks.js would overwrite the real
 * hook. Each test copies what it needs into a sandbox and runs the copy.
 */

const REPO_SCRIPTS = join(process.cwd(), "scripts");

/**
 * The child environment, with this machine shut out.
 *
 * - No global or system git config: a developer's own core.hooksPath or
 *   identity must not decide a test's outcome.
 * - No GIT_* variables: when Jest itself is started from a git hook they point
 *   at the real repository.
 * - No CI: GitHub sets it, and the installer skips when it is set.
 */
export function sandboxEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const name of Object.keys(env)) {
    if (name.startsWith("GIT_") || name === "CI") delete env[name];
  }
  return {
    ...env,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    ...extra,
  };
}

export interface Sandbox {
  /** Root of the throwaway directory. */
  dir: string;
  /** Runs a command inside the sandbox. */
  run: (command: string, args: string[], env?: NodeJS.ProcessEnv) => SpawnSyncReturns<string>;
  /** Runs git inside the sandbox and returns trimmed stdout. */
  git: (...args: string[]) => string;
  cleanup: () => void;
}

/** Creates a sandbox holding copies of the named files from scripts/. */
export function makeSandbox(scripts: string[], options: { gitRepo: boolean }): Sandbox {
  const dir = mkdtempSync(join(tmpdir(), "doit-scripts-"));
  mkdirSync(join(dir, "scripts"));
  for (const name of scripts) {
    copyFileSync(join(REPO_SCRIPTS, name), join(dir, "scripts", name));
  }

  const run: Sandbox["run"] = (command, args, env = sandboxEnv()) =>
    spawnSync(command, args, { cwd: dir, env, encoding: "utf8" });

  const git: Sandbox["git"] = (...args) => {
    const result = run("git", args);
    if (result.status !== 0) {
      throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
    }
    return result.stdout.trim();
  };

  if (options.gitRepo) git("init", "--quiet");

  return { dir, run, git, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}
