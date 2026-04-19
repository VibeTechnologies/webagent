import { isWebMCPSupported, getModelContext } from './detect';
import { ToolRegistry, type ToolDefinition } from '../tools/registry';

export class WebMCPConsumer {
  private discoveredTools: string[] = [];

  async discoverTools(registry: ToolRegistry): Promise<void> {
    if (!isWebMCPSupported()) return;

    const mc = getModelContext();
    if (!mc) return;

    // The consumer API is still evolving in the spec.
    // When available, we'll listen for tool registrations from the host page
    // and add them to our agent's tool registry.
    try {
      // Future API: mc.getRegisteredTools() or similar
      // For now, listen for custom events that host pages might dispatch
      if (typeof mc.addEventListener === 'function') {
        mc.addEventListener('toolregistered', (event: any) => {
          const tool = event.detail;
          if (tool && !registry.has(tool.name)) {
            const def: ToolDefinition = {
              name: `webmcp_${tool.name}`,
              description: tool.description || tool.title || tool.name,
              parameters: tool.inputSchema || {},
              execute: async (args) => tool.execute(args),
              source: 'webmcp',
            };
            registry.register(def);
            this.discoveredTools.push(tool.name);
          }
        });
      }
    } catch (err) {
      console.warn('WebMCP consumer discovery failed:', err);
    }
  }

  getDiscoveredTools(): string[] {
    return [...this.discoveredTools];
  }
}
