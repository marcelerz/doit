/**
 * Example: Using TodoModel in a Component
 *
 * This file demonstrates how to use TodoModel to simplify components
 * and centralize business logic. Copy these patterns into your own components.
 */

import { useState } from "react";
import { TodoModel } from "@/models/TodoModel";
import { useTodos } from "@/hooks/useTodos";

// ===== Example 1: Simple Display Component =====
// Shows how to display todo information using TodoModel getters

export function SimpleTodoDisplay() {
  const { todos, settings, createModels } = useTodos();
  const todoModels = createModels();

  return (
    <div>
      {todoModels.map((model) => (
        <div key={model.id}>
          <h3>{model.plainText}</h3>

          {/* Use smart getters - includes auto-assign defaults */}
          <p>Assigned: {model.assignedPeople.join(", ") || "None"}</p>
          <p>Projects: {model.projects.join(", ") || "None"}</p>
          <p>Priority: {model.priority || "None"}</p>

          {/* Use display helpers */}
          <p>Due: {model.dueDateDisplay || "No due date"}</p>
          <p>Duration: {model.durationMinutes ? `${model.durationMinutes} min` : "Not set"}</p>

          {/* Use state checks */}
          {model.isOverdue && <span className="text-red-500">OVERDUE!</span>}
          {model.isDueToday && <span className="text-yellow-500">Due today</span>}
          {model.isRecurring && <span>🔁 Recurring</span>}
        </div>
      ))}
    </div>
  );
}

// ===== Example 2: Filtering with TodoModel =====
// Shows how to filter todos using smart getters

export function FilteredTodoList({ personFilter }: { personFilter: string }) {
  const { createModels } = useTodos();
  const todoModels = createModels();

  // Filter using smart getters (includes auto-assign)
  const filtered = todoModels.filter((model) => model.assignedPeople.includes(personFilter));

  return (
    <div>
      <h2>Tasks for {personFilter}</h2>
      {filtered.map((model) => (
        <div key={model.id}>{model.plainText}</div>
      ))}
    </div>
  );
}

// ===== Example 3: Sorting with TodoModel =====
// Shows how to sort todos using TodoModel properties

export function SortedTodoList() {
  const { createModels } = useTodos();
  const todoModels = createModels();

  // Sort by priority (using priorityOrder)
  const sortedByPriority = [...todoModels].sort((a, b) => {
    const orderA = a.priorityOrder ?? 999;
    const orderB = b.priorityOrder ?? 999;
    return orderA - orderB;
  });

  // Sort by due date (using daysUntilDue)
  const sortedByDueDate = [...todoModels].sort((a, b) => {
    const daysA = a.daysUntilDue ?? 999;
    const daysB = b.daysUntilDue ?? 999;
    return daysA - daysB;
  });

  return (
    <div>
      <h2>Sorted by Priority</h2>
      {sortedByPriority.map((model) => (
        <div key={model.id}>
          {model.plainText} - {model.priority || "no priority"}
        </div>
      ))}
    </div>
  );
}

// ===== Example 4: Editor Component =====
// Shows how to use raw getters for editing (don't show auto-assign as if user set it)

export function TodoEditor({ todoId }: { todoId: string }) {
  const { todos, settings, editTodo } = useTodos();
  const todo = todos.find((t) => t.id === todoId);

  if (!todo) return null;

  const model = new TodoModel(todo, settings);

  // Use raw values for editing (shows actual stored values)
  const [assignedPeople, setAssignedPeople] = useState(model.assignedPeopleRaw);
  const [priority, setPriority] = useState(model.priorityRaw);
  const [dueDate, setDueDate] = useState(model.dueDateRaw);

  // Check if auto-assign will apply
  const willAutoAssign =
    assignedPeople.length === 0 && settings.autoAssign.enabled && settings.autoAssign.assignedPerson;

  const handleSave = () => {
    // Save using raw values
    const metadata = {
      ...todo.metadata,
      assignedPeople,
      priority,
      dueDate,
    };
    editTodo(todoId, todo.text, todo.plainText, metadata);
  };

  return (
    <div>
      <input
        value={assignedPeople.join(", ")}
        onChange={(e) => setAssignedPeople(e.target.value.split(",").map((s) => s.trim()))}
        placeholder={willAutoAssign ? `Will auto-assign to: ${settings.autoAssign.assignedPerson}` : "Assign to..."}
      />
      {willAutoAssign && (
        <small className="text-gray-500">ℹ️ Will auto-assign to {settings.autoAssign.assignedPerson}</small>
      )}
      <button onClick={handleSave}>Save</button>
    </div>
  );
}

// ===== Example 5: Dashboard/Stats Component =====
// Shows how to use TodoModel for aggregations and statistics

export function TodoDashboard() {
  const { createModels } = useTodos();
  const todoModels = createModels();

  // Count todos by state
  const activeCount = todoModels.filter((m) => m.isActive).length;
  const completedCount = todoModels.filter((m) => m.isCompleted).length;
  const overdueTodos = todoModels.filter((m) => m.isOverdue);
  const dueTodayTodos = todoModels.filter((m) => m.isDueToday);

  // Group by assigned people (using smart getter with auto-assign)
  const byPerson = todoModels.reduce((acc, model) => {
    model.assignedPeople.forEach((person) => {
      acc[person] = (acc[person] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Find longest duration task
  const longestTask = todoModels.reduce((longest, model) => {
    const mins = model.durationMinutes ?? 0;
    const longestMins = longest?.durationMinutes ?? 0;
    return mins > longestMins ? model : longest;
  }, null as TodoModel | null);

  return (
    <div>
      <h2>Dashboard</h2>
      <div>Active: {activeCount}</div>
      <div>Completed: {completedCount}</div>
      <div>Overdue: {overdueTodos.length}</div>
      <div>Due Today: {dueTodayTodos.length}</div>

      <h3>By Person</h3>
      {Object.entries(byPerson).map(([person, count]) => (
        <div key={person}>
          {person}: {count} tasks
        </div>
      ))}

      {longestTask && (
        <div>
          Longest task: {longestTask.plainText} ({longestTask.durationMinutes} min)
        </div>
      )}
    </div>
  );
}

// ===== Example 6: Conditional Rendering =====
// Shows how to use TodoModel state checks and date helpers

export function TodoItemWithBadges({ todoId }: { todoId: string }) {
  const { todos, settings } = useTodos();
  const todo = todos.find((t) => t.id === todoId);

  if (!todo) return null;

  const model = new TodoModel(todo, settings);

  return (
    <div>
      <h3>{model.plainText}</h3>

      {/* State badges */}
      {model.isCompleted && <span className="badge-green">✓ Completed</span>}
      {model.isArchived && <span className="badge-gray">📦 Archived</span>}

      {/* Due date badges */}
      {model.isOverdue && <span className="badge-red">⚠️ Overdue</span>}
      {model.isDueToday && <span className="badge-yellow">📅 Due Today</span>}
      {model.isDueThisWeek && <span className="badge-blue">📆 This Week</span>}

      {/* Recurring badge */}
      {model.isRecurring && <span className="badge-purple">🔁 {model.recurring}</span>}

      {/* Days until due */}
      {model.daysUntilDue !== undefined && (
        <span>
          {model.daysUntilDue < 0 ? `${Math.abs(model.daysUntilDue)} days overdue` : `${model.daysUntilDue} days left`}
        </span>
      )}

      {/* Priority with color */}
      {model.priority && <span style={{ backgroundColor: model.priorityColor }}>{model.priority}</span>}
    </div>
  );
}

// ===== Example 7: Comparing Raw vs Smart Values =====
// Shows when you might want to show both raw and smart values

export function TodoMetadataComparison({ todoId }: { todoId: string }) {
  const { todos, settings } = useTodos();
  const todo = todos.find((t) => t.id === todoId);

  if (!todo) return null;

  const model = new TodoModel(todo, settings);

  return (
    <div>
      <h3>{model.plainText}</h3>

      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Stored Value</th>
            <th>Effective Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Assigned</td>
            <td>{model.assignedPeopleRaw.join(", ") || "(empty)"}</td>
            <td>{model.assignedPeople.join(", ") || "(empty)"}</td>
          </tr>
          <tr>
            <td>Projects</td>
            <td>{model.projectsRaw.join(", ") || "(empty)"}</td>
            <td>{model.projects.join(", ") || "(empty)"}</td>
          </tr>
          <tr>
            <td>Priority</td>
            <td>{model.priorityRaw || "(empty)"}</td>
            <td>{model.priority || "(empty)"}</td>
          </tr>
          <tr>
            <td>Due Date</td>
            <td>{model.dueDateRaw || "(empty)"}</td>
            <td>{model.dueDate || "(empty)"}</td>
          </tr>
        </tbody>
      </table>

      {model.wouldAutoAssignApply && <p className="text-sm text-gray-500">ℹ️ Auto-assign defaults are being applied</p>}
    </div>
  );
}
