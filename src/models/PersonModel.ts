/**
 * PersonModel - Business Logic Abstraction for Person entities
 *
 * Extends BaseEntityModel with person-specific validation and behavior.
 * Wraps the raw Person interface with computed properties, validation methods,
 * and display helpers to keep business logic out of views.
 *
 * Pattern: Hooks maintain raw Person[] in state, but return PersonModel[] to consumers
 * via useMemo for automatic wrapping.
 */

import type { Person, PersonId } from "@/types/person";
import { getPersonId } from "@/types/person";
import { generatePrefixedUUID } from "@/utils/idGenerator";
import { BaseEntityModel } from "./BaseEntityModel";

/**
 * PersonModel wraps a Person with business logic and computed properties.
 *
 * Use this instead of raw Person objects in components for cleaner code.
 * The model provides validation, display formatting, and computed properties.
 */
export class PersonModel extends BaseEntityModel<Person> {
  constructor(person: Person) {
    super(person);
  }

  // ============================================================================
  // STATIC ID FACTORY
  // ============================================================================

  /**
   * Create a new unique ID for a Person.
   * @returns A PersonId with prefix "person-" followed by a UUID
   */
  static createId(): PersonId {
    return getPersonId(generatePrefixedUUID("person"));
  }

  // ============================================================================
  // ENTITY TYPE
  // ============================================================================

  protected get entityTypeName(): string {
    return "Person";
  }

  // ============================================================================
  // PERSON-SPECIFIC VALIDATION
  // ============================================================================

  /**
   * Check if this person can be deleted
   * @param allTodos Optional array of todos to check for dependencies
   * @returns Validation result with reason if not allowed
   */
  canDelete(allTodos?: Array<{ assignedPeople?: string[] }>): {
    canDelete: boolean;
    reason?: string;
  } {
    if (allTodos) {
      const isAssigned = allTodos.some((todo) => todo.assignedPeople?.includes(this.id));
      if (isAssigned) {
        return { canDelete: false, reason: "Person is assigned to active todos" };
      }
    }
    return { canDelete: true };
  }
}

/**
 * Factory function to create PersonModel instances from raw Person objects
 *
 * Usage in hooks:
 * ```ts
 * const [rawPeople, setRawPeople] = useState<Person[]>([]);
 * const people = useMemo(() => createPersonModels(rawPeople), [rawPeople]);
 * ```
 */
export function createPersonModels(people: Person[]): PersonModel[] {
  return people.map((person) => new PersonModel(person));
}

/**
 * Helper to create a single PersonModel
 */
export function createPersonModel(person: Person): PersonModel {
  return new PersonModel(person);
}
