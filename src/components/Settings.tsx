import React, { useState } from 'react';
import { useStore } from '../store/store';
import { Settings as SettingsIcon, Save, Plus, Trash2 } from 'lucide-react';
import { AppConfig, Prompt, ModelConfig } from '../types';

const ModelsSettings: React.FC<{
  models: ModelConfig[];
  onSave: (models: ModelConfig[]) => void;
}> = ({ models, onSave }) => {
  const [editedModels, setEditedModels] = useState(models);

  const handleAddModel = () => {
    setEditedModels([
      ...editedModels,
      {
        name: '',
        parameters: {
          temperature: 0.7,
          maxTokens: 2048,
        },
      },
    ]);
  };

  const handleRemoveModel = (index: number) => {
    setEditedModels(editedModels.filter((_, i) => i !== index));
  };

  const handleModelChange = (index: number, field: string, value: any) => {
    setEditedModels(
      editedModels.map((model, i) =>
        i === index
          ? {
              ...model,
              [field]: field === 'parameters' ? { ...model.parameters, ...value } : value,
            }
          : model
      )
    );
  };

  return (
    <div className="space-y-4">
      {editedModels.map((model, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={model.name}
              onChange={(e) => handleModelChange(index, 'name', e.target.value)}
              placeholder="Model name"
              className="px-2 py-1 border rounded"
            />
            <button
              onClick={() => handleRemoveModel(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-600">Temperature</label>
              <input
                type="number"
                value={model.parameters.temperature}
                onChange={(e) =>
                  handleModelChange(index, 'parameters', {
                    temperature: parseFloat(e.target.value),
                  })
                }
                step="0.1"
                min="0"
                max="1"
                className="px-2 py-1 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Max Tokens</label>
              <input
                type="number"
                value={model.parameters.maxTokens}
                onChange={(e) =>
                  handleModelChange(index, 'parameters', {
                    maxTokens: parseInt(e.target.value),
                  })
                }
                className="px-2 py-1 border rounded w-full"
              />
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-between">
        <button
          onClick={handleAddModel}
          className="flex items-center space-x-1 text-blue-500 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Model</span>
        </button>
        <button
          onClick={() => onSave(editedModels)}
          className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
};

const PromptsSettings: React.FC<{
  prompts: Prompt[];
  onSave: (prompts: Prompt[]) => void;
}> = ({ prompts, onSave }) => {
  const [editedPrompts, setEditedPrompts] = useState(prompts);

  const handleAddPrompt = () => {
    setEditedPrompts([
      ...editedPrompts,
      {
        name: '',
        description: '',
        promptTemplate: '',
        systemPrompt: '',
      },
    ]);
  };

  const handleRemovePrompt = (index: number) => {
    setEditedPrompts(editedPrompts.filter((_, i) => i !== index));
  };

  const handlePromptChange = (index: number, field: string, value: string) => {
    setEditedPrompts(
      editedPrompts.map((prompt, i) =>
        i === index ? { ...prompt, [field]: value } : prompt
      )
    );
  };

  return (
    <div className="space-y-4">
      {editedPrompts.map((prompt, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={prompt.name}
              onChange={(e) => handlePromptChange(index, 'name', e.target.value)}
              placeholder="Prompt name"
              className="px-2 py-1 border rounded"
            />
            <button
              onClick={() => handleRemovePrompt(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={prompt.description}
            onChange={(e) =>
              handlePromptChange(index, 'description', e.target.value)
            }
            placeholder="Description"
            className="px-2 py-1 border rounded w-full"
          />
          <textarea
            value={prompt.promptTemplate}
            onChange={(e) =>
              handlePromptChange(index, 'promptTemplate', e.target.value)
            }
            placeholder="Prompt template"
            className="px-2 py-1 border rounded w-full h-24"
          />
          <textarea
            value={prompt.systemPrompt}
            onChange={(e) =>
              handlePromptChange(index, 'systemPrompt', e.target.value)
            }
            placeholder="System prompt (optional)"
            className="px-2 py-1 border rounded w-full h-24"
          />
        </div>
      ))}
      <div className="flex justify-between">
        <button
          onClick={handleAddPrompt}
          className="flex items-center space-x-1 text-blue-500 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prompt</span>
        </button>
        <button
          onClick={() => onSave(editedPrompts)}
          className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
};

const AppsSettings: React.FC<{
  apps: AppConfig[];
  models: ModelConfig[];
  prompts: Prompt[];
  onSave: (apps: AppConfig[]) => void;
}> = ({ apps, models, prompts, onSave }) => {
  const [editedApps, setEditedApps] = useState(apps);

  const handleAddApp = () => {
    setEditedApps([
      ...editedApps,
      {
        appName: '',
        model: models[0]?.name || '',
        prompt: prompts[0]?.name || '',
        defaultTemperature: 0.7,
        maxTokens: 1024,
        useSystemPrompt: true,
        systemPrompt: '',
      },
    ]);
  };

  const handleRemoveApp = (index: number) => {
    setEditedApps(editedApps.filter((_, i) => i !== index));
  };

  const handleAppChange = (index: number, field: string, value: any) => {
    setEditedApps(
      editedApps.map((app, i) =>
        i === index ? { ...app, [field]: value } : app
      )
    );
  };

  return (
    <div className="space-y-4">
      {editedApps.map((app, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={app.appName}
              onChange={(e) => handleAppChange(index, 'appName', e.target.value)}
              placeholder="Application name"
              className="px-2 py-1 border rounded"
            />
            <button
              onClick={() => handleRemoveApp(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Model</label>
              <select
                value={app.model}
                onChange={(e) => handleAppChange(index, 'model', e.target.value)}
                className="px-2 py-1 border rounded w-full"
              >
                {models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Prompt</label>
              <select
                value={app.prompt}
                onChange={(e) => handleAppChange(index, 'prompt', e.target.value)}
                className="px-2 py-1 border rounded w-full"
              >
                {prompts.map((prompt) => (
                  <option key={prompt.name} value={prompt.name}>
                    {prompt.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Temperature</label>
              <input
                type="number"
                value={app.defaultTemperature}
                onChange={(e) =>
                  handleAppChange(
                    index,
                    'defaultTemperature',
                    parseFloat(e.target.value)
                  )
                }
                step="0.1"
                min="0"
                max="1"
                className="px-2 py-1 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Max Tokens</label>
              <input
                type="number"
                value={app.maxTokens}
                onChange={(e) =>
                  handleAppChange(index, 'maxTokens', parseInt(e.target.value))
                }
                className="px-2 py-1 border rounded w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={app.useSystemPrompt}
              onChange={(e) =>
                handleAppChange(index, 'useSystemPrompt', e.target.checked)
              }
              className="rounded"
            />
            <label className="text-sm text-gray-600">Use System Prompt</label>
          </div>
          
          {app.useSystemPrompt && (
            <textarea
              value={app.systemPrompt}
              onChange={(e) =>
                handleAppChange(index, 'systemPrompt', e.target.value)
              }
              placeholder="System prompt"
              className="px-2 py-1 border rounded w-full h-24"
            />
          )}
        </div>
      ))}
      <div className="flex justify-between">
        <button
          onClick={handleAddApp}
          className="flex items-center space-x-1 text-blue-500 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Application</span>
        </button>
        <button
          onClick={() => onSave(editedApps)}
          className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
};

export const Settings: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { models, prompts, apps, setModels, setPrompts, setApps } = useStore();
  const [activeTab, setActiveTab] = useState<'models' | 'prompts' | 'apps'>('models');

  const handleSaveModels = (updatedModels: ModelConfig[]) => {
    setModels(updatedModels);
    onClose();
  };

  const handleSavePrompts = (updatedPrompts: Prompt[]) => {
    setPrompts(updatedPrompts);
    onClose();
  };

  const handleSaveApps = (updatedApps: AppConfig[]) => {
    setApps(updatedApps);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <h2 className="text-xl font-bold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b">
          <button
            className={`px-4 py-2 ${
              activeTab === 'models'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('models')}
          >
            Models
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'prompts'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('prompts')}
          >
            Prompts
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'apps'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('apps')}
          >
            Applications
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'models' && (
            <ModelsSettings models={models} onSave={handleSaveModels} />
          )}
          {activeTab === 'prompts' && (
            <PromptsSettings prompts={prompts} onSave={handleSavePrompts} />
          )}
          {activeTab === 'apps' && (
            <AppsSettings
              apps={apps}
              models={models}
              prompts={prompts}
              onSave={handleSaveApps}
            />
          )}
        </div>
      </div>
    </div>
  );
};