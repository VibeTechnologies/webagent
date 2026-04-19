// Schema migration placeholder for future IndexedDB upgrades
export function migrateSession(data: any, fromVersion: number, toVersion: number): any {
  let current = { ...data };
  
  // Migration v0 → v1: ensure all required fields exist
  if (fromVersion < 1) {
    current = {
      id: current.id || '',
      messages: current.messages || [],
      todos: current.todos || [],
      createdAt: current.createdAt || Date.now(),
      updatedAt: current.updatedAt || Date.now(),
      ...current,
    };
  }
  
  return current;
}
