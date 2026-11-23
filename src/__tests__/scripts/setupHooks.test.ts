import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { makeSandbox, Sandbox, sandboxEnv } from "./scriptSandbox";

/**
 * scripts/setup-hooks.js runs from `postinstall`, so every `npm install` and
 * `npm ci` executes it. It must install doit's own hook and nothing else: a
 * hook the developer already has -- a secret scanner, say -- is not ours to
 * replace.
 */

const SOURCE_HOOK = readFileSync(join(process.cwd(), "scripts", "pre-commit"), "utf8");
/** The hook as shipped before it carried a marker line. */
const LEGACY_HOOK = readFileSync(join(__dirname, "fixtures", "legacy-pre-commit.txt"), "utf8");
const FOREIGN_HOOK = "#!/bin/sh\n# someone's secret scanner\nexit 0\n";
const MARKER = "# doit-managed-hook";

let sandbox: Sandbox;

beforeEach(() => {
  sandbox = makeSandbox(["setup-hooks.js", "pre-commit"], { gitRepo: true });
});

afterEach(() => {
  sandbox.cleanup();
});

function repoHook(): string {
  return join(sandbox.dir, ".git", "hooks", "pre-commit");
}

function install(env?: NodeJS.ProcessEnv) {
  return sandbox.run(process.execPath, ["scripts/setup-hooks.js"], env);
}

describe("setup-hooks.js", () => {
  it("installs the hook into a repository that has none", () => {
    const result = install();

    expect(result.status).toBe(0);
    expect(readFileSync(repoHook(), "utf8")).toBe(SOURCE_HOOK);
    // Executable for the owner, or git silently ignores it.
    expect(statSync(repoHook()).mode & 0o100).toBe(0o100);
  });

  it("ships a hook that carries the marker it looks for", () => {
    expect(SOURCE_HOOK).toContain(MARKER);
  });

  it("leaves a hook it does not manage untouched, and says so", () => {
    writeFileSync(repoHook(), FOREIGN_HOOK);

    const result = install();

    expect(result.status).toBe(0);
    expect(readFileSync(repoHook(), "utf8")).toBe(FOREIGN_HOOK);
    expect(result.stdout + result.stderr).toMatch(/left untouched/i);
  });

  it("updates a hook that carries the marker", () => {
    writeFileSync(repoHook(), `#!/bin/bash\n${MARKER}\necho "an older doit hook"\n`);

    install();

    expect(readFileSync(repoHook(), "utf8")).toBe(SOURCE_HOOK);
  });

  it("updates the hook shipped before the marker existed", () => {
    // Without this, every existing checkout would keep the old hook forever:
    // it has no marker, so it would look like somebody else's.
    writeFileSync(repoHook(), LEGACY_HOOK);

    install();

    expect(readFileSync(repoHook(), "utf8")).toBe(SOURCE_HOOK);
  });

  it("recognises the pre-marker hook with Windows line endings", () => {
    writeFileSync(repoHook(), LEGACY_HOOK.replace(/\n/g, "\r\n"));

    install();

    expect(readFileSync(repoHook(), "utf8")).toBe(SOURCE_HOOK);
  });

  it("writes nothing when the repository sets core.hooksPath", () => {
    const customDir = join(sandbox.dir, "team-hooks");
    mkdirSync(customDir);
    writeFileSync(join(customDir, "pre-commit"), FOREIGN_HOOK);
    sandbox.git("config", "core.hooksPath", customDir);

    const result = install();

    expect(result.status).toBe(0);
    expect(readFileSync(join(customDir, "pre-commit"), "utf8")).toBe(FOREIGN_HOOK);
    expect(existsSync(repoHook())).toBe(false);
    expect(result.stdout + result.stderr).toMatch(/core\.hooksPath/);
  });

  it("writes nothing when a global core.hooksPath is set", () => {
    // The case that matters most: a shared hooks directory is used by every
    // repository on the machine, so overwriting it there disables the
    // developer's hook everywhere and runs doit's version bump in its place.
    const globalDir = join(sandbox.dir, "global-hooks");
    mkdirSync(globalDir);
    writeFileSync(join(globalDir, "pre-commit"), FOREIGN_HOOK);
    const globalConfig = join(sandbox.dir, "global.gitconfig");
    writeFileSync(globalConfig, `[core]\n\thooksPath = ${globalDir}\n`);

    const result = install(sandboxEnv({ GIT_CONFIG_GLOBAL: globalConfig }));

    expect(result.status).toBe(0);
    expect(readFileSync(join(globalDir, "pre-commit"), "utf8")).toBe(FOREIGN_HOOK);
    expect(existsSync(repoHook())).toBe(false);
  });

  it("does nothing in CI", () => {
    const result = install(sandboxEnv({ CI: "true" }));

    expect(result.status).toBe(0);
    expect(existsSync(repoHook())).toBe(false);
  });

  it("exits cleanly outside a git repository", () => {
    const bare = makeSandbox(["setup-hooks.js", "pre-commit"], { gitRepo: false });
    try {
      // GIT_CEILING_DIRECTORIES stops git walking up into a repository that
      // happens to contain the temp directory.
      const result = bare.run(
        process.execPath,
        ["scripts/setup-hooks.js"],
        sandboxEnv({ GIT_CEILING_DIRECTORIES: bare.dir }),
      );

      expect(result.status).toBe(0);
      expect(existsSync(join(bare.dir, ".git"))).toBe(false);
    } finally {
      bare.cleanup();
    }
  });
});
