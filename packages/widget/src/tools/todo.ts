import type { TodoItem } from '../agent/types';

export type TodoAction = 'add' | 'list' | 'complete' | 'remove' | 'update';

export interface TodoParams {
  action: TodoAction;
  title?: string;
  description?: string;
  id?: string;
}

export function manageTodo(
  todos: TodoItem[],
  params: TodoParams,
): { todos: TodoItem[]; result: any } {
  switch (params.action) {
    case 'add': {
      if (!params.title) return { todos, result: { error: 'Title is required' } };
      const newTodo: TodoItem = {
        id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: params.title,
        description: params.description,
        completed: false,
        createdAt: Date.now(),
      };
      return {
        todos: [...todos, newTodo],
        result: { success: true, todo: newTodo },
      };
    }
    case 'list':
      return { todos, result: { todos } };
    case 'complete': {
      if (!params.id) return { todos, result: { error: 'ID is required' } };
      return {
        todos: todos.map(t => t.id === params.id ? { ...t, completed: true } : t),
        result: { success: true, id: params.id },
      };
    }
    case 'remove': {
      if (!params.id) return { todos, result: { error: 'ID is required' } };
      return {
        todos: todos.filter(t => t.id !== params.id),
        result: { success: true, id: params.id },
      };
    }
    case 'update': {
      if (!params.id) return { todos, result: { error: 'ID is required' } };
      return {
        todos: todos.map(t => t.id === params.id ? {
          ...t,
          title: params.title || t.title,
          description: params.description ?? t.description,
        } : t),
        result: { success: true, id: params.id },
      };
    }
    default:
      return { todos, result: { error: `Unknown action: ${params.action}` } };
  }
}
