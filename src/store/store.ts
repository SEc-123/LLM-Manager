import { create } from 'zustand';
import { AppConfig, Prompt, ModelConfig, Message, ChatHistory, Workflow, WorkflowNode } from '../types';

interface Store {
  prompts: Prompt[];
  apps: AppConfig[];
  models: ModelConfig[];
  selectedApp: string | null;
  chatHistories: ChatHistory[];
  workflows: Workflow[];
  activeWorkflow: string | null;
  setPrompts: (prompts: Prompt[]) => void;
  setApps: (apps: AppConfig[]) => void;
  setModels: (models: ModelConfig[]) => void;
  setSelectedApp: (appName: string | null) => void;
  addMessage: (appName: string, message: Message) => void;
  clearHistory: (appName: string) => void;
  createWorkflow: (name: string) => void;
  updateWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (id: string | null) => void;
}

export const useStore = create<Store>((set) => ({
  prompts: [],
  apps: [],
  models: [],
  selectedApp: null,
  chatHistories: [],
  workflows: [],
  activeWorkflow: null,
  setPrompts: (prompts) => set({ prompts }),
  setApps: (apps) => set({ apps }),
  setModels: (models) => set({ models }),
  setSelectedApp: (appName) => set({ selectedApp: appName }),
  addMessage: (appName, message) =>
    set((state) => {
      const existingHistory = state.chatHistories.find((h) => h.appName === appName);
      if (existingHistory) {
        return {
          chatHistories: state.chatHistories.map((h) =>
            h.appName === appName
              ? { ...h, messages: [...h.messages, message] }
              : h
          ),
        };
      }
      return {
        chatHistories: [
          ...state.chatHistories,
          { appName, messages: [message] },
        ],
      };
    }),
  clearHistory: (appName) =>
    set((state) => ({
      chatHistories: state.chatHistories.filter((h) => h.appName !== appName),
    })),
  createWorkflow: (name) =>
    set((state) => ({
      workflows: [
        ...state.workflows,
        {
          id: crypto.randomUUID(),
          name,
          nodes: [],
        },
      ],
    })),
  updateWorkflow: (workflow) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflow.id ? workflow : w
      ),
    })),
  deleteWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
      activeWorkflow: state.activeWorkflow === id ? null : state.activeWorkflow,
    })),
  setActiveWorkflow: (id) => set({ activeWorkflow: id }),
}));