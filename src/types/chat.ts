import type { ReactNode } from 'react';

export type ChatVariant = 'ai' | 'user' | 'agent' | 'error';

export type TextContentBlock = {
  type: 'text';
  content: string;
  textType?: 'reasoning' | 'text';
};

export type ToolContentBlock = {
  type: 'tool';
  toolCallId: string;
  toolName: string;
  input: any;
  output?: string;
};

export type AgentContentBlock = {
  type: 'agent';
  agentId: string;
  agentName: string;
  agentType: string;
  content: string;
  status: 'running' | 'complete' | 'failed';
  blocks?: ContentBlock[];
};

export type ContentBlock =
  | TextContentBlock
  | ToolContentBlock
  | AgentContentBlock;

export type ChatMessage = {
  id: string;
  variant: ChatVariant;
  content: string;
  blocks?: ContentBlock[];
  timestamp: string;
  isComplete?: boolean;
};
