import type { Skill } from '../agent/types';
import { isWebMcpAvailable } from './detect';

/**
 * Generate hidden <form> elements with WebMCP declarative attributes.
 * Browsers that support WebMCP will expose these as discoverable tools.
 */
export function createDeclarativeForms(
  skills: Skill[],
  container: HTMLElement,
): HTMLFormElement[] {
  if (!isWebMcpAvailable()) return [];

  const forms: HTMLFormElement[] = [];

  for (const skill of skills) {
    const form = document.createElement('form');
    form.setAttribute('toolname', skill.name);
    form.setAttribute('tooldescription', skill.description);
    form.setAttribute('toolautosubmit', '');
    form.style.display = 'none';

    const props = skill.parameters?.properties;
    if (props && typeof props === 'object') {
      for (const [name, schema] of Object.entries(props as Record<string, any>)) {
        const input = document.createElement('input');
        input.name = name;
        input.type = schema.type === 'number' ? 'number' : 'text';
        input.setAttribute('toolparamdescription', schema.description || name);
        if (skill.parameters?.required?.includes(name)) input.required = true;
        form.appendChild(input);
      }
    }

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = skill.name;
    form.appendChild(submit);

    form.addEventListener('submit', (e: SubmitEvent) => {
      e.preventDefault();
      const data = new FormData(form);
      const params = Object.fromEntries(data.entries());

      if ((e as any).agentInvoked && typeof (e as any).respondWith === 'function') {
        (e as any).respondWith(
          Promise.resolve({ success: true, toolName: skill.name, params }),
        );
      }
    });

    container.appendChild(form);
    forms.push(form);
  }

  return forms;
}
