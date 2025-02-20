export interface Prompt {
  name: string;
  description: string;
  promptTemplate: string;
  systemPrompt?: string;
}

export interface AppConfig {
  appName: string;
  model: string;
  prompt: string;
  defaultTemperature: number;
  maxTokens: number;
  useSystemPrompt: boolean;
  systemPrompt?: string;
}

export interface ModelConfig {
  name: string;
  parameters: {
    temperature: number;
    maxTokens: number;
  };
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatHistory {
  appName: string;
  messages: Message[];
}

export interface WorkflowNode {
  id: string;
  appName: string;
  position: number;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  isPinned?: boolean;
}

export interface WorkflowExecution {
  input: string;
  nodes: {
    nodeId: string;
    input: string;
    output: string;
    timestamp: number;
  }[];
  timestamp: number;
  finalOutput?: string;
}