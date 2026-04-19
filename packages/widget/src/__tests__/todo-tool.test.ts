import { describe, expect, it, vi } from 'vitest';
import type { TodoItem } from '../agent/types';

type TodoAction = 'add' | 'list' | 'complete' | 'remove';

type TodoArgs = {
  action: TodoAction;
  title?: string;
  description?: string;
  id?: string;
};

function createTodoExecutor(initialTodos: TodoItem[] = []) {
  let todos = [...initialTodos];

  const getTodos = () => todos;
  const setTodos = (next: TodoItem[]) => {
    todos = next;
  };

  const execute = async ({ action, title, description, id }: TodoArgs) => {
    const current = getTodos();
    let result: any;

    switch (action) {
      case 'add': {
        if (!title) return { error: 'Title is required' };
        const newTodo: TodoItem = {
          id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title,
          description,
          completed: false,
          createdAt: Date.now(),
        };
        setTodos([...current, newTodo]);
        result = { success: true, todo: newTodo };
        break;
      }
      case 'list':
        result = { todos: current };
        break;
      case 'complete':
        if (!id) return { error: 'ID is required' };
        setTodos(current.map(t => (t.id === id ? { ...t, completed: true } : t)));
        result = { success: true, id };
        break;
      case 'remove':
        if (!id) return { error: 'ID is required' };
        setTodos(current.filter(t => t.id !== id));
        result = { success: true, id };
        break;
    }

    return result;
  };

  return { execute, getTodos };
}

describe('todo tool logic', () => {
  it('add creates todo with title, description, unique id and timestamp', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const todoTool = createTodoExecutor();
    const result = await todoTool.execute({
      action: 'add',
      title: 'Write tests',
      description: 'For widget package',
    });

    expect(result.success).toBe(true);
    expect(result.todo).toMatchObject({
      title: 'Write tests',
      description: 'For widget package',
      completed: false,
      createdAt: 1700000000000,
    });
    expect(result.todo.id).toMatch(/^todo_1700000000000_/);
    expect(todoTool.getTodos()).toHaveLength(1);
  });

  it('add without title returns error', async () => {
    const todoTool = createTodoExecutor();
    await expect(todoTool.execute({ action: 'add' })).resolves.toEqual({
      error: 'Title is required',
    });
  });

  it('list returns current todos', async () => {
    const todos: TodoItem[] = [
      {
        id: 'todo_1',
        title: 'First',
        completed: false,
        createdAt: Date.now(),
      },
    ];
    const todoTool = createTodoExecutor(todos);

    await expect(todoTool.execute({ action: 'list' })).resolves.toEqual({ todos });
  });

  it('complete marks todo as completed', async () => {
    const todos: TodoItem[] = [
      {
        id: 'todo_1',
        title: 'First',
        completed: false,
        createdAt: Date.now(),
      },
    ];
    const todoTool = createTodoExecutor(todos);

    const result = await todoTool.execute({ action: 'complete', id: 'todo_1' });

    expect(result).toEqual({ success: true, id: 'todo_1' });
    expect(todoTool.getTodos()[0]?.completed).toBe(true);
  });

  it('complete without id returns error', async () => {
    const todoTool = createTodoExecutor();
    await expect(todoTool.execute({ action: 'complete' })).resolves.toEqual({
      error: 'ID is required',
    });
  });

  it('remove removes todo from list', async () => {
    const todos: TodoItem[] = [
      {
        id: 'todo_1',
        title: 'First',
        completed: false,
        createdAt: Date.now(),
      },
    ];
    const todoTool = createTodoExecutor(todos);

    const result = await todoTool.execute({ action: 'remove', id: 'todo_1' });

    expect(result).toEqual({ success: true, id: 'todo_1' });
    expect(todoTool.getTodos()).toEqual([]);
  });

  it('remove without id returns error', async () => {
    const todoTool = createTodoExecutor();
    await expect(todoTool.execute({ action: 'remove' })).resolves.toEqual({
      error: 'ID is required',
    });
  });
});
