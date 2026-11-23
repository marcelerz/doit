/**
 * Reading and writing version.json.
 *
 * The file feeds the deploy build, which stamps it into the service worker, so
 * a caller either gets a version made of three non-negative integers or an
 * error -- never a half-valid object to do arithmetic on.
 *
 * scripts/pre-commit carries its own inline copy of this check on purpose: the
 * installed hook is shared by every branch and worktree and must not depend on
 * a file that a given checkout may not have.
 */

const fs = require("fs");

const FIELDS = ["major", "minor", "revision"];

/** Reads and validates a version file. Throws with a message fit for the terminal. */
function readVersion(file) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file} could not be read as JSON: ${error.message}`);
  }

  const valid =
    data !== null &&
    typeof data === "object" &&
    FIELDS.every((field) => Number.isInteger(data[field]) && data[field] >= 0);
  if (!valid) {
    throw new Error(`${file} must hold non-negative integers for major, minor and revision`);
  }

  return { major: data.major, minor: data.minor, revision: data.revision };
}

function writeVersion(file, version) {
  fs.writeFileSync(file, JSON.stringify(version, null, 2) + "\n", "utf8");
}

function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.revision}`;
}

module.exports = { readVersion, writeVersion, formatVersion };
