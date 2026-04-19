import type { Skill } from '../agent/types';
import { isWebMcpAvailable } from './detect';

/**
 * Register widget skills as WebMCP imperative tools via navigator.modelContext.
 * External AI agents (Chrome Gemini, etc.) can discover and invoke them.
 */
export function registerSkillsAsWebMcpTools(
  skills: Skill[],
  apiBase: string,
  apiKey: string,
  abortController: AbortController,
): void {
  if (!isWebMcpAvailable()) return;

  const mc = (navigator as any).modelContext;
  if (!mc?.registerTool) return;

  for (const skill of skills) {
    mc.registerTool(
      {
        name: skill.name,
        title: skill.name.replace(/-/g, ' '),
        description: skill.description,
        inputSchema: skill.parameters || {},
        annotations: { readOnlyHint: true },
        execute: async (input: Record<string, any>) => {
          let url = skill.endpoint;
          for (const [key, value] of Object.entries(input)) {
            url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
          }

          const res = await fetch(`${apiBase}/api/fetch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              url,
              method: skill.method,
              headers: skill.headers,
              body: skill.bodyTemplate
                ? JSON.parse(
                    JSON.stringify(skill.bodyTemplate).replace(
                      /"\{\{(\w+)\}\}"/g,
                      (_, k) => JSON.stringify(input[k] ?? null),
                    ),
                  )
                : undefined,
            }),
          });
          return res.json();
        },
      },
      { signal: abortController.signal },
    );
  }
}
