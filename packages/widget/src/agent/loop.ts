import { generateText, streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import type { WebAgentConfig, ChatMessage, Skill, TodoItem } from './types';
import { loadKnowledge, searchKnowledge } from './knowledge';

export interface AgentCallbacks {
  onStream: (chunk: string) => void;
  onToolCall: (name: string, args: Record<string, any>) => void;
  onToolResult: (name: string, result: any) => void;
  onComplete: (message: ChatMessage) => void;
  onError: (error: Error) => void;
  getTodos: () => TodoItem[];
  setTodos: (todos: TodoItem[]) => void;
}

export async function runAgent(
  config: WebAgentConfig,
  messages: ChatMessage[],
  callbacks: AgentCallbacks,
): Promise<ChatMessage> {
  const provider = createOpenAI({
    baseURL: config.apiBase + '/v1',
    apiKey: config.apiKey || 'anonymous',
  });

  // Build system prompt with knowledge base context
  let systemPrompt = config.systemPrompt || 'You are a helpful support agent.';
  
  if (config.knowledgeBaseUrl) {
    const kb = await loadKnowledge(config.knowledgeBaseUrl);
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const relevantChunks = searchKnowledge(kb, lastUserMessage);
    if (relevantChunks.length > 0) {
      systemPrompt += '\n\n## Relevant Knowledge Base:\n' + 
        relevantChunks.map(c => `### ${c.title}\n${c.content}`).join('\n\n');
    }
  }

  // Convert our messages to AI SDK format
  const aiMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  // Build tool definitions
  const tools: Record<string, any> = {};

  // web_fetch tool
  tools.web_fetch = tool({
    description: 'Fetch a URL via the backend proxy to bypass CORS. Use for retrieving web pages, API data, etc.',
    parameters: z.object({
      url: z.string().describe('The URL to fetch'),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET').describe('HTTP method'),
      headers: z.record(z.string()).optional().describe('Request headers'),
      body: z.any().optional().describe('Request body for POST/PUT'),
    }),
    execute: async ({ url, method, headers, body }) => {
      callbacks.onToolCall('web_fetch', { url, method });
      try {
        const res = await fetch(`${config.apiBase}/api/fetch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey || ''}`,
          },
          body: JSON.stringify({ url, method, headers, body }),
        });
        const result = await res.json();
        callbacks.onToolResult('web_fetch', result);
        return result;
      } catch (err: any) {
        const error = { error: err.message };
        callbacks.onToolResult('web_fetch', error);
        return error;
      }
    },
  });

  // skill tool
  if (config.skills && config.skills.length > 0) {
    tools.skill = tool({
      description: `Execute a preloaded API skill. Available skills: ${config.skills.map(s => `${s.name} (${s.description})`).join(', ')}`,
      parameters: z.object({
        skillName: z.string().describe('Name of the skill to execute'),
        params: z.record(z.any()).describe('Parameters for the skill'),
      }),
      execute: async ({ skillName, params }) => {
        callbacks.onToolCall('skill', { skillName, params });
        const skill = config.skills!.find(s => s.name === skillName);
        if (!skill) {
          const error = { error: `Skill not found: ${skillName}` };
          callbacks.onToolResult('skill', error);
          return error;
        }
        try {
          const result = await executeSkill(config, skill, params);
          callbacks.onToolResult('skill', result);
          return result;
        } catch (err: any) {
          const error = { error: err.message };
          callbacks.onToolResult('skill', error);
          return error;
        }
      },
    });
  }

  // todo tool
  tools.todo = tool({
    description: 'Manage a task list for the user. Use to track steps in multi-step processes.',
    parameters: z.object({
      action: z.enum(['add', 'list', 'complete', 'remove']).describe('Action to perform'),
      title: z.string().optional().describe('Todo title (for add)'),
      description: z.string().optional().describe('Todo description (for add)'),
      id: z.string().optional().describe('Todo ID (for complete/remove)'),
    }),
    execute: async ({ action, title, description, id }) => {
      callbacks.onToolCall('todo', { action, title, id });
      const todos = callbacks.getTodos();
      let result: any;
      
      switch (action) {
        case 'add':
          if (!title) return { error: 'Title is required' };
          const newTodo = {
            id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title,
            description,
            completed: false,
            createdAt: Date.now(),
          };
          callbacks.setTodos([...todos, newTodo]);
          result = { success: true, todo: newTodo };
          break;
        case 'list':
          result = { todos };
          break;
        case 'complete':
          if (!id) return { error: 'ID is required' };
          callbacks.setTodos(todos.map(t => t.id === id ? { ...t, completed: true } : t));
          result = { success: true, id };
          break;
        case 'remove':
          if (!id) return { error: 'ID is required' };
          callbacks.setTodos(todos.filter(t => t.id !== id));
          result = { success: true, id };
          break;
      }
      
      callbacks.onToolResult('todo', result);
      return result;
    },
  });

  // send_email tool
  tools.send_email = tool({
    description: 'Send an email to a specified recipient. Use when the user asks to contact someone via email.',
    parameters: z.object({
      to: z.string().describe('Recipient email address'),
      subject: z.string().describe('Email subject'),
      body: z.string().describe('Email body (HTML supported)'),
    }),
    execute: async ({ to, subject, body }) => {
      callbacks.onToolCall('send_email', { to, subject });
      try {
        const res = await fetch(`${config.apiBase}/api/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey || ''}`,
          },
          body: JSON.stringify({ to, subject, body }),
        });
        const result = await res.json();
        callbacks.onToolResult('send_email', result);
        return result;
      } catch (err: any) {
        const error = { error: err.message };
        callbacks.onToolResult('send_email', error);
        return error;
      }
    },
  });

  // escalate_to_human tool
  tools.escalate_to_human = tool({
    description: 'Escalate the conversation to a human support agent. Use when you cannot resolve the issue or the user explicitly requests human help.',
    parameters: z.object({
      reason: z.string().describe('Reason for escalation'),
      userEmail: z.string().describe('User email address for follow-up'),
      userName: z.string().optional().describe('User name'),
      context: z.string().optional().describe('Additional context'),
    }),
    execute: async ({ reason, userEmail, userName, context }) => {
      callbacks.onToolCall('escalate_to_human', { reason, userEmail });
      try {
        const transcript = messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        const res = await fetch(`${config.apiBase}/api/escalate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey || ''}`,
          },
          body: JSON.stringify({
            userEmail,
            userName,
            context: context || reason,
            transcript,
            supportEmail: config.supportEmail || 'support@example.com',
          }),
        });
        const result = await res.json();
        callbacks.onToolResult('escalate_to_human', result);
        if (config.onEscalation) {
          config.onEscalation({
            ticketId: result.ticketId,
            userEmail,
            userName,
            context: reason,
            success: result.success,
          });
        }
        return result;
      } catch (err: any) {
        const error = { error: err.message };
        callbacks.onToolResult('escalate_to_human', error);
        return error;
      }
    },
  });

  try {
    const result = await generateText({
      model: provider(config.model || 'gpt-4o-mini'),
      system: systemPrompt,
      messages: aiMessages,
      tools,
      maxSteps: config.maxSteps || 10,
    });

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: result.text,
      timestamp: Date.now(),
    };

    callbacks.onComplete(assistantMessage);
    return assistantMessage;
  } catch (err: any) {
    callbacks.onError(err);
    throw err;
  }
}

async function executeSkill(
  config: WebAgentConfig,
  skill: Skill,
  params: Record<string, any>,
): Promise<any> {
  // Build URL with template substitution
  let url = skill.endpoint;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(skill.headers || {}),
  };

  // Build body from template
  let body: any = undefined;
  if (skill.bodyTemplate && ['POST', 'PUT', 'PATCH'].includes(skill.method)) {
    body = JSON.parse(JSON.stringify(skill.bodyTemplate));
    for (const [key, value] of Object.entries(params)) {
      const bodyStr = JSON.stringify(body);
      body = JSON.parse(bodyStr.replace(`"{{${key}}}"`, JSON.stringify(value)));
    }
  }

  // Execute via web_fetch proxy
  const res = await fetch(`${config.apiBase}/api/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey || ''}`,
    },
    body: JSON.stringify({
      url,
      method: skill.method,
      headers,
      body,
    }),
  });

  return res.json();
}
