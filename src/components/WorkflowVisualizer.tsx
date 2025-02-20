import React, { useState } from 'react';
import { ArrowRight, Sparkles, X, Settings2, Save } from 'lucide-react';
import { useStore } from '../store/store';

export const WorkflowVisualizer: React.FC = () => {
  const { workflows, activeWorkflow, apps, updateWorkflow } = useStore();
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  
  const activeWorkflowData = workflows.find(w => w.id === activeWorkflow);
  
  const handleDragStart = (e: React.DragEvent, appName: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ appName }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!activeWorkflow) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const workflow = workflows.find(w => w.id === activeWorkflow);
      if (!workflow) return;

      const newNode = {
        id: crypto.randomUUID(),
        appName: data.appName,
        position: workflow.nodes.length,
      };

      const updatedWorkflow = {
        ...workflow,
        nodes: [...workflow.nodes, newNode],
      };

      updateWorkflow(updatedWorkflow);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleRemoveNode = (nodeId: string) => {
    if (!activeWorkflowData) return;

    const updatedNodes = activeWorkflowData.nodes.filter(node => node.id !== nodeId);
    const reorderedNodes = updatedNodes.map((node, index) => ({
      ...node,
      position: index,
    }));

    updateWorkflow({
      ...activeWorkflowData,
      nodes: reorderedNodes,
    });
  };

  const handleSaveWorkflow = () => {
    if (!activeWorkflowData || !workflowName.trim()) return;

    const updatedWorkflow = {
      ...activeWorkflowData,
      name: workflowName.trim(),
    };

    updateWorkflow(updatedWorkflow);
    setShowSaveDialog(false);
  };

  if (!activeWorkflowData) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a workflow to view its configuration
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Workflow Canvas */}
      <div className="flex-1 p-6 border-b-2 border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{activeWorkflowData.name}</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setWorkflowName(activeWorkflowData.name);
                setShowSaveDialog(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Workflow</span>
            </button>
          </div>
        </div>

        {/* Save Workflow Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[400px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Save Workflow</h3>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Enter workflow name"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveWorkflow}
                    disabled={!workflowName.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Workflow Chain */}
        <div 
          className="flex-1 overflow-x-auto"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="min-h-[200px] bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-start gap-4 overflow-x-auto pb-4">
              {activeWorkflowData.nodes.length === 0 ? (
                <div className="w-full text-center text-gray-400">
                  Drag applications here to create a workflow chain
                </div>
              ) : (
                activeWorkflowData.nodes.map((node, index) => {
                  const app = apps.find(a => a.appName === node.appName);
                  const isEditing = editingNode === node.id;

                  return (
                    <div key={node.id} className="flex items-center flex-shrink-0">
                      <div className="bg-white rounded-lg shadow-md p-4 w-[300px] relative group">
                        <button
                          onClick={() => handleRemoveNode(node.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg">{app?.appName}</h3>
                          <button
                            onClick={() => setEditingNode(isEditing ? null : node.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Model: {app?.model}</p>
                          <p className="text-sm text-gray-600">Temperature: {app?.defaultTemperature}</p>
                        </div>
                      </div>
                      {index < activeWorkflowData.nodes.length - 1 && (
                        <ArrowRight className="w-6 h-6 text-gray-400 mx-2 flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available Models */}
      <div className="h-1/3 p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Available Applications</h3>
        <div className="grid grid-cols-4 gap-4">
          {apps.map((app) => (
            <div
              key={app.appName}
              draggable
              onDragStart={(e) => handleDragStart(e, app.appName)}
              className="bg-white p-4 rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h4 className="font-medium">{app.appName}</h4>
              </div>
              <p className="text-sm text-gray-600">Model: {app.model}</p>
              <p className="text-sm text-gray-600">Temperature: {app.defaultTemperature}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};