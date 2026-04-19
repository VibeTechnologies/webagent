import type { Skill } from '../agent/types';
import { isWebMCPSupported, getModelContext } from './detect';

export class WebMCPProvider {
  private abortController: AbortController;
  private registeredTools: string[] = [];

  constructor() {
    this.abortController = new AbortController();
  }

  async registerSkills(
    skills: Skill[],
    executeSkill: (skill: Skill, params: Record<string, any>) => Promise<any>,
  ): Promise<void> {
    if (!isWebMCPSupported()) return;
    
    const mc = getModelContext();
    if (!mc) return;

    for (const skill of skills) {
      try {
        await mc.registerTool({
          name: skill.name,
          title: skill.title,
          description: skill.description,
          inputSchema: skill.parameters,
          annotations: {
            readOnlyHint: skill.readOnly ?? false,
          },
          execute: async (input: Record<string, any>) => {
            return executeSkill(skill, input);
          },
        }, { signal: this.abortController.signal });

        this.registeredTools.push(skill.name);
      } catch (err) {
        console.warn(`Failed to register WebMCP tool: ${skill.name}`, err);
      }
    }
  }

  destroy(): void {
    this.abortController.abort();
    this.registeredTools = [];
  }

  getRegisteredTools(): string[] {
    return [...this.registeredTools];
  }
}
