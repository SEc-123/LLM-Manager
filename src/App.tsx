import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { WorkflowVisualizer } from './components/WorkflowVisualizer';
import { WorkflowExecutor } from './components/WorkflowExecutor';
import { useStore } from './store/store';

// Mock data for development
const mockPrompts = [
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
];

const mockApps = [
  {
    appName: 'Code Helper',
    model: 'llama2-7b',
    prompt: 'code_assistant',
    defaultTemperature: 0.7,
    maxTokens: 1024,
    useSystemPrompt: true,
    systemPrompt: 'You are a professional coding assistant.',
  },
  {
    appName: 'Writing Helper',
    model: 'llama2-7b',
    prompt: 'writing_assistant',
    defaultTemperature: 0.8,
    maxTokens: 2048,
    useSystemPrompt: true,
    systemPrompt: 'You are a professional writing assistant.',
  }
];

const mockModels = [
  {
    name: 'llama2-7b',
    parameters: {
      temperature: 0.7,
      maxTokens: 2048,
    },
  },
  {
    name: 'llama2-13b',
    parameters: {
      temperature: 0.7,
      maxTokens: 4096,
    },
  }
];

function App() {
  const { setPrompts, setApps, setModels, activeWorkflow, selectedApp } = useStore();

  useEffect(() => {
    // Initialize with mock data
    setPrompts(mockPrompts);
    setApps(mockApps);
    setModels(mockModels);
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        {activeWorkflow ? (
          <div className="flex-1 flex">
            <div className="w-1/2 border-r">
              <WorkflowVisualizer />
            </div>
            <div className="w-1/2">
              <WorkflowExecutor />
            </div>
          </div>
        ) : selectedApp ? (
          <Chat />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select an application or workflow to begin
          </div>
        )}
      </div>
    </div>
  );
}

export default App;