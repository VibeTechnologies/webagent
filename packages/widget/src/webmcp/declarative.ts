import type { Skill } from '../agent/types';
import { isWebMCPSupported } from './detect';

export function createDeclarativeForms(
  skills: Skill[],
  container: HTMLElement,
  executeSkill: (skill: Skill, params: Record<string, any>) => Promise<any>,
): HTMLFormElement[] {
  if (!isWebMCPSupported()) return [];

  const forms: HTMLFormElement[] = [];

  for (const skill of skills) {
    // Only create forms for skills with simple parameters
    const props = skill.parameters?.properties;
    if (!props) continue;

    const form = document.createElement('form');
    form.setAttribute('toolname', skill.name);
    form.setAttribute('tooldescription', skill.description);
    form.setAttribute('toolautosubmit', '');
    form.style.display = 'none'; // Hidden — only for WebMCP agents

    for (const [name, schema] of Object.entries(props) as [string, any][]) {
      const input = document.createElement('input');
      input.name = name;
      input.setAttribute('toolparamdescription', schema.description || name);

      if (schema.type === 'number' || schema.type === 'integer') {
        input.type = 'number';
        if (schema.minimum !== undefined) input.min = String(schema.minimum);
        if (schema.maximum !== undefined) input.max = String(schema.maximum);
      } else {
        input.type = 'text';
      }

      if (skill.parameters?.required?.includes(name)) {
        input.required = true;
      }

      form.appendChild(input);
    }

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = skill.title;
    form.appendChild(submit);

    // Handle form submission (both user and agent-invoked)
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const params: Record<string, any> = {};
      formData.forEach((value, key) => {
        params[key] = value;
      });

      const result = await executeSkill(skill, params);

      // If agent-invoked, use respondWith
      if ((event as any).respondWith) {
        (event as any).respondWith(
          new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
    });

    container.appendChild(form);
    forms.push(form);
  }

  return forms;
}
