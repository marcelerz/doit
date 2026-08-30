/**
 * Rewriting person and project references when an entity is renamed.
 *
 * Todos, notes, reviews and templates reference people and projects by NAME
 * rather than by id (see the comment in useTodos), so renaming an entity used
 * to orphan every reference to it: the person kept their history but their
 * todos pointed at a name nobody had any more, and their reference counts
 * dropped to nothing.
 *
 * These are pure functions over plain records so the rewrite can be unit
 * tested on its own; the hooks apply them.
 *
 * Only marker-prefixed occurrences (`@Name`, `$Name`, `%Name`) are rewritten
 * inside free text. Bare names in prose are deliberately left alone -- there is
 * no way to tell the project "Web" from the word "Web" in "Web design", and
 * corrupting a user's sentence is worse than a stale-looking word. Callers
 * compensate by keeping the old name as an alternative, which keeps
 * matchesAnyName resolving anything that was missed.
 */

/** Escape a string for literal use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replace `name` with `nextName` in a list of name references. */
export function renameInNames(names: string[] | undefined, name: string, nextName: string): string[] | undefined {
  if (!names || names.length === 0) return names;
  let changed = false;
  const updated = names.map((entry) => {
    if (entry.toLowerCase() !== name.toLowerCase()) return entry;
    changed = true;
    return nextName;
  });
  if (!changed) return names;
  // A rename can collide with a reference that already used the new name.
  return [...new Set(updated)];
}

/**
 * Rewrite `@Name` / `$Name` / `%Name` markers in SmartInput text.
 *
 * The trailing lookahead mirrors the marker regex SmartInput itself builds, so
 * renaming "Marcel" leaves an unrelated "@Marcelo" alone. It cannot help when
 * the following prose happens to repeat the new name -- "@Marcel Erz" becomes
 * "@Marcel Erz Erz" -- but that rewrite is correct, since the marker really did
 * reference the renamed person.
 */
export function renameMarkersInText(
  text: string | undefined,
  name: string,
  nextName: string,
  symbols: readonly string[],
): string | undefined {
  if (text === undefined || text === "") return text;
  let updated = text;
  for (const symbol of symbols) {
    const pattern = new RegExp(`${escapeRegExp(symbol)}(${escapeRegExp(name)})(?=\\s|$)`, "gi");
    updated = updated.replace(pattern, `${symbol}${nextName}`);
  }
  return updated;
}

/** The people/project reference fields todos and notes share. */
export interface NameReferenceFields {
  assignedPeople?: string[];
  sourcePeople?: string[];
  mentionedPeople?: string[];
  projects?: string[];
}

export type EntityKind = "person" | "project";

/** The marker symbols that can introduce a reference to each entity kind. */
const MARKERS: Record<EntityKind, readonly string[]> = {
  person: ["@", "$"],
  project: ["%"],
};

/** Apply a rename to the shared reference fields, returning null if nothing changed. */
export function renameInReferenceFields<T extends NameReferenceFields>(
  record: T,
  kind: EntityKind,
  name: string,
  nextName: string,
): T | null {
  const updated: T = { ...record };
  let changed = false;

  const fields: (keyof NameReferenceFields)[] =
    kind === "person" ? ["assignedPeople", "sourcePeople", "mentionedPeople"] : ["projects"];

  for (const field of fields) {
    const next = renameInNames(record[field], name, nextName);
    if (next !== record[field]) {
      (updated as NameReferenceFields)[field] = next;
      changed = true;
    }
  }

  return changed ? updated : null;
}

/** Apply a rename to a record's SmartInput text pair, returning null if nothing changed. */
export function renameInTextFields<T extends { text?: string; plainText?: string }>(
  record: T,
  kind: EntityKind,
  name: string,
  nextName: string,
): T | null {
  const symbols = MARKERS[kind];
  const text = renameMarkersInText(record.text, name, nextName, symbols);
  const plainText = renameMarkersInText(record.plainText, name, nextName, symbols);
  if (text === record.text && plainText === record.plainText) return null;
  return { ...record, text, plainText };
}

/**
 * Apply a rename to one record: reference fields and marker text together.
 *
 * Returns null when the record does not mention the entity, so callers can skip
 * writing records they did not touch.
 */
export function renameInRecord<T extends NameReferenceFields & { text?: string; plainText?: string }>(
  record: T,
  kind: EntityKind,
  name: string,
  nextName: string,
): T | null {
  const byFields = renameInReferenceFields(record, kind, name, nextName);
  const byText = renameInTextFields(byFields ?? record, kind, name, nextName);
  return byText ?? byFields;
}

/** Apply a rename to a set-shaped filter value, as saved in view options and presets. */
export function renameInFilters<T extends NameReferenceFields>(
  filters: T,
  kind: EntityKind,
  name: string,
  nextName: string,
): T | null {
  return renameInReferenceFields(filters, kind, name, nextName);
}

/**
 * Whether a proposed name is already taken by another entity.
 *
 * Compared case-insensitively against names and alternatives, matching how
 * lookups resolve them, so "marcel" cannot shadow "Marcel".
 */
export function isNameTaken(
  entities: Array<{ id: string; name: string; alternatives?: string[] }>,
  nextName: string,
  exceptId: string,
): boolean {
  const candidate = nextName.trim().toLowerCase();
  if (candidate === "") return false;
  return entities.some(
    (entity) =>
      entity.id !== exceptId &&
      (entity.name.toLowerCase() === candidate ||
        (entity.alternatives ?? []).some((alt) => alt.toLowerCase() === candidate)),
  );
}
