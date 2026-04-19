import type { Skill } from '../agent/types';
import { webFetch } from './web-fetch';

export async function executeSkill(
  apiBase: string,
  apiKey: string,
  skill: Skill,
  params: Record<string, any>,
): Promise<any> {
  let url = skill.endpoint;
  
  // Template substitution in URL
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(skill.headers || {}),
  };

  // Template substitution in headers
  for (const [hKey, hValue] of Object.entries(headers)) {
    for (const [pKey, pValue] of Object.entries(params)) {
      headers[hKey] = hValue.replace(`{{${pKey}}}`, String(pValue));
    }
  }

  let body: any = undefined;
  if (skill.bodyTemplate && ['POST', 'PUT', 'PATCH'].includes(skill.method.toUpperCase())) {
    body = JSON.parse(
      JSON.stringify(skill.bodyTemplate).replace(
        /"\{\{(\w+)\}\}"/g,
        (_, key) => JSON.stringify(params[key] ?? null),
      ),
    );
  }

  return webFetch(apiBase, apiKey, {
    url,
    method: skill.method,
    headers,
    body,
  });
}
