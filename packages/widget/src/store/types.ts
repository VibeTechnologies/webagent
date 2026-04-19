import type { ChatMessage, TodoItem } from '../agent/types';

export interface SessionData {
  id: string;
  messages: ChatMessage[];
  todos: TodoItem[];
  createdAt: number;
  updatedAt: number;
  config?: Record<string, any>;
}

export interface StorageAdapter {
  get(key: string): Promise<SessionData | null>;
  set(key: string, data: SessionData): Promise<void>;
  delete(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
  clear(): Promise<void>;
}
