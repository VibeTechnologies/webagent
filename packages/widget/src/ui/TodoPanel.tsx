import { h } from 'preact';
import type { TodoItem } from '../agent/types';

interface TodoPanelProps {
  todos: TodoItem[];
}

export function TodoPanel({ todos }: TodoPanelProps) {
  const pending = todos.filter(t => !t.completed);
  const completed = todos.filter(t => t.completed);

  return (
    <div class="webagent-todo-panel">
      <div class="webagent-todo-header">
        Tasks ({pending.length} remaining)
      </div>
      <div class="webagent-todo-list">
        {pending.map(todo => (
          <div key={todo.id} class="webagent-todo-item">
            <span class="webagent-todo-checkbox">☐</span>
            <div>
              <div class="webagent-todo-title">{todo.title}</div>
              {todo.description && <div class="webagent-todo-desc">{todo.description}</div>}
            </div>
          </div>
        ))}
        {completed.map(todo => (
          <div key={todo.id} class="webagent-todo-item webagent-todo-done">
            <span class="webagent-todo-checkbox">☑</span>
            <div class="webagent-todo-title">{todo.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
