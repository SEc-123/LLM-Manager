import { Config } from '../types';

export const defaultConfig: Config = {
  models: [
    {
      name: 'deepseek-coder:6.7b',
      parameters: {
        temperature: 0.7,
        maxTokens: 2048,
      },
    },
    {
      name: 'codellama:7b',
      parameters: {
        temperature: 0.7,
        maxTokens: 2048,
      },
    },
    {
      name: 'llama2:7b',
      parameters: {
        temperature: 0.7,
        maxTokens: 2048,
      },
    }
  ],
  prompts: [
    {
      name: 'code_assistant',
      description: 'Helps with coding questions',
      promptTemplate: 'You are a coding assistant. User question: {user_input}',
      systemPrompt: 'You are a helpful coding assistant that provides clear and concise answers.',
    },
    {
      name: 'writing_assistant',
      description: 'Helps with writing and editing',
      promptTemplate: 'You are a writing assistant. Please help with the following: {user_input}',
      systemPrompt: 'You are a professional writing assistant focused on clarity and style.',
    }
  ],
  apps: [
    {
      appName: 'Code Helper',
      model: 'deepseek-coder:6.7b',
      prompt: 'code_assistant',
      defaultTemperature: 0.7,
      maxTokens: 1024,
      useSystemPrompt: true,
      systemPrompt: 'You are a professional coding assistant.',
    },
    {
      appName: 'Writing Helper',
      model: 'llama2:7b',
      prompt: 'writing_assistant',
      defaultTemperature: 0.8,
      maxTokens: 2048,
      useSystemPrompt: true,
      systemPrompt: 'You are a professional writing assistant.',
    }
  ]
};