export interface WebAgentConfig {
  apiBase: string;
  apiKey?: string;
  systemPrompt?: string;
  skills?: Skill[];
  knowledgeBaseUrl?: string;
  theme?: 'light' | 'dark' | 'auto' | ThemeConfig;
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
  persistence?: 'indexeddb' | 'localStorage' | 'none';
  maxSteps?: number;
  model?: string;
  supportEmail?: string;
  sessionTtlDays?: number;
  onEscalation?: (ticket: EscalationTicket) => void;
  onMessage?: (message: ChatMessage) => void;
}

export interface ThemeConfig {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  fabSize?: string;
}

export interface Skill {
  name: string;
  title: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  bodyTemplate?: Record<string, any>;
  readOnly?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  suggestions?: string[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: any;
  isError?: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: number;
}

export interface EscalationTicket {
  ticketId: string;
  userEmail: string;
  userName?: string;
  context?: string;
  success: boolean;
}

export type AgentState = 'idle' | 'thinking' | 'executing-tool' | 'streaming';
