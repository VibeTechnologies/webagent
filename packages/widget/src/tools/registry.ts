import type { Skill } from '../agent/types';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: Record<string, any>) => Promise<any>;
  source?: 'builtin' | 'skill' | 'webmcp';
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  clear(): void {
    this.tools.clear();
  }

  registerSkill(skill: Skill, execute: (args: Record<string, any>) => Promise<any>): void {
    this.register({
      name: `skill_${skill.name}`,
      description: skill.description,
      parameters: skill.parameters,
      execute,
      source: 'skill',
    });
  }
}
