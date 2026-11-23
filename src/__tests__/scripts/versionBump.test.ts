import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "fs";
import { delimiter, join } from "path";
import { makeSandbox, Sandbox, sandboxEnv } from "./scriptSandbox";

/**
 * version.json is read by the deploy build, which stamps it into the service
 * worker. A bump that writes something invalid breaks the next deploy, so
 * every path that writes the file must either write a valid version or leave
 * it exactly as it was.
 */

const VALID = '{\n  "major": 0,\n  "minor": 1,\n  "revision": 41\n}\n';

/** Inputs no bump may accept. Each must leave the file byte for byte as it was. */
const INVALID_FILES: Array<[string, string]> = [
  ["malformed JSON", '{ "major": 0, "minor": 1, "revision": '],
  ["a string revision", '{ "major": 0, "minor": 1, "revision": "41" }'],
  ["a missing field", '{ "major": 0, "revision": 41 }'],
  ["a negative number", '{ "major": 0, "minor": -1, "revision": 41 }'],
  ["a fraction", '{ "major": 0, "minor": 1, "revision": 41.5 }'],
  ["a non-object", "null"],
];

let sandbox: Sandbox;

afterEach(() => {
  sandbox.cleanup();
});

function versionFile(): string {
  return join(sandbox.dir, "version.json");
}

function readVersion(): unknown {
  return JSON.parse(readFileSync(versionFile(), "utf8"));
}

/** Absolute path of an executable on this process's PATH. */
function findOnPath(name: string): string {
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    const candidate = join(dir, name);
    if (dir !== "" && existsSync(candidate)) return candidate;
  }
  throw new Error(`${name} not found on PATH`);
}

describe("pre-commit hook", () => {
  beforeEach(() => {
    sandbox = makeSandbox(["pre-commit"], { gitRepo: true });
  });

  function runHook(env?: NodeJS.ProcessEnv) {
    return sandbox.run("/bin/bash", ["scripts/pre-commit"], env);
  }

  it("bumps the revision by one and stages the file", () => {
    writeFileSync(versionFile(), VALID);

    const result = runHook();

    expect(result.status).toBe(0);
    expect(readVersion()).toEqual({ major: 0, minor: 1, revision: 42 });
    expect(sandbox.git("diff", "--cached", "--name-only")).toBe("version.json");
  });

  it("keeps the file format stable, so a bump is a one-line diff", () => {
    writeFileSync(versionFile(), VALID);

    runHook();

    expect(readFileSync(versionFile(), "utf8")).toBe(VALID.replace("41", "42"));
  });

  it("skips quietly when there is no version file", () => {
    const result = runHook();

    expect(result.status).toBe(0);
    expect(existsSync(versionFile())).toBe(false);
  });

  it.each(INVALID_FILES)("aborts the commit on %s and leaves the file alone", (_name, content) => {
    writeFileSync(versionFile(), content);

    const result = runHook();

    expect(result.status).not.toBe(0);
    expect(readFileSync(versionFile(), "utf8")).toBe(content);
    expect(sandbox.git("diff", "--cached", "--name-only")).toBe("");
  });

  it("aborts the commit when node is not on PATH", () => {
    // GUI git clients often start hooks with a minimal PATH. The hook used to
    // carry on with empty values and write `"major": ,`.
    writeFileSync(versionFile(), VALID);
    const bin = join(sandbox.dir, "bin");
    mkdirSync(bin);
    for (const tool of ["git", "cat"]) {
      symlinkSync(findOnPath(tool), join(bin, tool));
    }

    const result = runHook(sandboxEnv({ PATH: bin }));

    expect(result.status).not.toBe(0);
    expect(readFileSync(versionFile(), "utf8")).toBe(VALID);
    expect(result.stderr).toMatch(/node/);
  });

  it("aborts the commit when the bumped file cannot be staged", () => {
    // Otherwise the commit lands without the bump and leaves a modified
    // version.json behind in a tree that should be clean.
    writeFileSync(versionFile(), VALID);
    const bin = join(sandbox.dir, "bin");
    mkdirSync(bin);
    const failingAdd = `#!/bin/sh\nif [ "$1" = "add" ]; then echo "fatal: cannot stage" >&2; exit 1; fi\nexec "${findOnPath("git")}" "$@"\n`;
    writeFileSync(join(bin, "git"), failingAdd, { mode: 0o755 });

    const result = runHook(sandboxEnv({ PATH: `${bin}${delimiter}${process.env.PATH ?? ""}` }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/could not be staged/);
    expect(sandbox.git("diff", "--cached", "--name-only")).toBe("");
  });

  it("depends on no other file in the repository", () => {
    // The hooks folder is shared by every branch and worktree, so the
    // installed copy runs against checkouts that may not have newer scripts.
    // The sandbox holds scripts/pre-commit and nothing else.
    writeFileSync(versionFile(), VALID);

    expect(runHook().status).toBe(0);
  });
});

describe("bump-version.js", () => {
  beforeEach(() => {
    sandbox = makeSandbox(["bump-version.js", "version-file.js"], { gitRepo: false });
  });

  function bump(type: string) {
    return sandbox.run(process.execPath, ["scripts/bump-version.js", type]);
  }

  it("bumps the minor version and resets the revision", () => {
    writeFileSync(versionFile(), VALID);

    expect(bump("minor").status).toBe(0);
    expect(readVersion()).toEqual({ major: 0, minor: 2, revision: 0 });
  });

  it("bumps the major version and resets minor and revision", () => {
    writeFileSync(versionFile(), VALID);

    expect(bump("major").status).toBe(0);
    expect(readVersion()).toEqual({ major: 1, minor: 0, revision: 0 });
  });

  it("rejects an unknown bump type without writing", () => {
    writeFileSync(versionFile(), VALID);

    expect(bump("patch").status).not.toBe(0);
    expect(readFileSync(versionFile(), "utf8")).toBe(VALID);
  });

  it.each(INVALID_FILES)("refuses %s and leaves the file alone", (_name, content) => {
    // `+= 1` on a string field used to write "411".
    writeFileSync(versionFile(), content);

    expect(bump("minor").status).not.toBe(0);
    expect(readFileSync(versionFile(), "utf8")).toBe(content);
  });
});

describe("fix-github-pages.js", () => {
  const SW = 'const VERSION = "__BUILD_VERSION__";\n';

  beforeEach(() => {
    sandbox = makeSandbox(["fix-github-pages.js", "version-file.js"], { gitRepo: false });
    mkdirSync(join(sandbox.dir, "out"));
    writeFileSync(join(sandbox.dir, "out", "sw.js"), SW);
  });

  function fix() {
    return sandbox.run(process.execPath, ["scripts/fix-github-pages.js"]);
  }

  it("stamps the version into the service worker", () => {
    writeFileSync(versionFile(), VALID);

    expect(fix().status).toBe(0);
    expect(readFileSync(join(sandbox.dir, "out", "sw.js"), "utf8")).toBe('const VERSION = "0.1.41";\n');
  });

  it.each(INVALID_FILES)("fails the build on %s rather than stamping it", (_name, content) => {
    // A worker stamped "undefined.1.41" still deploys, and nothing notices.
    writeFileSync(versionFile(), content);

    expect(fix().status).not.toBe(0);
    expect(readFileSync(join(sandbox.dir, "out", "sw.js"), "utf8")).toBe(SW);
  });
});
