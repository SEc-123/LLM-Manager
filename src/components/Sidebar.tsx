import React, { useState, useRef, useEffect } from 'react';
import { Brain, Settings as SettingsIcon, Sparkles, GitBranch, Plus, Pin, PinOff } from 'lucide-react';
import { useStore } from '../store/store';
import { Settings } from './Settings';
import { WorkflowNode } from '../types';

export const Sidebar: React.FC = () => {
  const { apps, selectedApp, setSelectedApp, workflows, createWorkflow, updateWorkflow, activeWorkflow, setActiveWorkflow } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNewWorkflowInput, setShowNewWorkflowInput] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  
  // 添加 ref 用于检测点击外部
  const newWorkflowInputRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showNewWorkflowInput &&
        newWorkflowInputRef.current &&
        !newWorkflowInputRef.current.contains(event.target as Node)
      ) {
        setShowNewWorkflowInput(false);
        setNewWorkflowName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNewWorkflowInput]);

  const handleDragStart = (e: React.DragEvent, appName: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ appName }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!activeWorkflow) return;

    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    const workflow = workflows.find(w => w.id === activeWorkflow);
    if (!workflow) return;

    const newNode: WorkflowNode = {
      id: crypto.randomUUID(),
      appName: data.appName,
      position: workflow.nodes.length,
    };

    updateWorkflow({
      ...workflow,
      nodes: [...workflow.nodes, newNode],
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCreateWorkflow = () => {
    if (newWorkflowName.trim()) {
      createWorkflow(newWorkflowName.trim());
      setNewWorkflowName('');
      setShowNewWorkflowInput(false);
    }
  };

  const handleTogglePin = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      updateWorkflow({
        ...workflow,
        isPinned: !workflow.isPinned
      });
    }
  };

  const handleAppClick = (appName: string) => {
    setSelectedApp(appName);
    setActiveWorkflow(null); // 清除活动工作流
  };

  const handleWorkflowClick = (workflowId: string) => {
    setActiveWorkflow(workflowId);
    setSelectedApp(null); // 清除选中的应用
  };

  // 将工作流分为固定和未固定两组
  const pinnedWorkflows = workflows.filter(w => w.isPinned);
  const unpinnedWorkflows = workflows.filter(w => !w.isPinned);

  return (
    <>
      <div className="w-64 bg-gray-900 text-white h-screen p-4 flex flex-col">
        <div className="flex items-center space-x-2 mb-8">
          <Brain className="w-8 h-8" />
          <h1 className="text-xl font-bold">LLM Manager</h1>
        </div>
        
        <div className="flex-1 space-y-6 overflow-auto">
          <div>
            <h2 className="text-sm font-semibold text-gray-400 mb-2">Applications</h2>
            <div className="space-y-1">
              {apps.map((app) => (
                <div
                  key={app.appName}
                  draggable
                  onDragStart={(e) => handleDragStart(e, app.appName)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 cursor-move ${
                    selectedApp === app.appName ? 'bg-blue-600' : 'hover:bg-gray-800'
                  }`}
                  onClick={() => handleAppClick(app.appName)}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{app.appName}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-gray-400">Workflows</h2>
              <button
                onClick={() => setShowNewWorkflowInput(true)}
                className="text-gray-400 hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showNewWorkflowInput && (
              <div ref={newWorkflowInputRef} className="mb-2 flex space-x-2">
                <input
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="Workflow name"
                  className="flex-1 px-2 py-1 rounded bg-gray-800 text-white text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateWorkflow();
                    } else if (e.key === 'Escape') {
                      setShowNewWorkflowInput(false);
                      setNewWorkflowName('');
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleCreateWorkflow}
                  className="px-2 py-1 bg-blue-600 rounded text-sm"
                >
                  Add
                </button>
              </div>
            )}
            <div
              className="space-y-4"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* 固定的工作流 */}
              {pinnedWorkflows.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider pl-2">
                    Pinned Workflows
                  </h3>
                  {pinnedWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between group ${
                        activeWorkflow === workflow.id ? 'bg-blue-600' : 'hover:bg-gray-800'
                      }`}
                      onClick={() => handleWorkflowClick(workflow.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <GitBranch className="w-4 h-4" />
                        <span>{workflow.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">
                          {workflow.nodes.length} apps
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(workflow.id);
                          }}
                          className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100"
                        >
                          <PinOff className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 未固定的工作流 */}
              {unpinnedWorkflows.length > 0 && (
                <div className="space-y-1">
                  {pinnedWorkflows.length > 0 && (
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider pl-2">
                      Other Workflows
                    </h3>
                  )}
                  {unpinnedWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between group ${
                        activeWorkflow === workflow.id ? 'bg-blue-600' : 'hover:bg-gray-800'
                      }`}
                      onClick={() => handleWorkflowClick(workflow.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <GitBranch className="w-4 h-4" />
                        <span>{workflow.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">
                          {workflow.nodes.length} apps
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(workflow.id);
                          }}
                          className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100"
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 mt-4"
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {isSettingsOpen && (
        <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  );
};