import { isWebMcpAvailable } from './detect';

export interface DiscoveredTool {
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
}

/**
 * Discover WebMCP tools registered by the host page.
 * Returns them so the agent loop can incorporate them as additional tools.
 *
 * NOTE: The WebMCP consumer/discovery API is still evolving in the spec.
 * This is a best-effort implementation based on the early preview API.
 */
export function discoverHostWebMcpTools(): DiscoveredTool[] {
  if (!isWebMcpAvailable()) return [];

  const mc = (navigator as any).modelContext;
  if (mc?.getTools) {
    try {
      const tools = mc.getTools();
      return Array.isArray(tools)
        ? tools.map((t: any) => ({
            name: t.name || 'unknown',
            description: t.description || '',
            inputSchema: t.inputSchema,
          }))
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Invoke a host page WebMCP tool by name.
 */
export async function invokeHostWebMcpTool(
  name: string,
  input: Record<string, any>,
): Promise<any> {
  if (!isWebMcpAvailable()) throw new Error('WebMCP not available');

  const mc = (navigator as any).modelContext;
  if (!mc?.invokeTool) throw new Error('WebMCP invokeTool not available');

  return mc.invokeTool(name, input);
}
