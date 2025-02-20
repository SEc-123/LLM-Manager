import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock, RotateCcw, AlertCircle, CheckCircle, Loader, Calendar, X } from 'lucide-react';
import { useStore } from '../store/store';
import { generateCompletion } from '../services/ollama';
import { Workflow, WorkflowNode, WorkflowExecution } from '../types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds

interface ExecutionStatus {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  retries: number;
  error?: string;
  output?: string;
}

interface ScheduleConfig {
  type: 'interval' | 'daily' | 'weekly' | 'monthly';
  interval?: number; // minutes for interval type
  time?: string; // HH:mm for daily/weekly/monthly
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
}

export const WorkflowExecutor: React.FC = () => {
  const { workflows, activeWorkflow, apps } = useStore();
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatuses, setExecutionStatuses] = useState<ExecutionStatus[]>([]);
  const [executionHistory, setExecutionHistory] = useState<WorkflowExecution[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({ type: 'interval' });
  const [isScheduled, setIsScheduled] = useState(false);
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
  const [scheduledTimeout, setScheduledTimeout] = useState<NodeJS.Timeout | null>(null);
  const [finalOutput, setFinalOutput] = useState<string>('');

  const activeWorkflowData = workflows.find(w => w.id === activeWorkflow);

  useEffect(() => {
    return () => {
      if (scheduledTimeout) {
        clearTimeout(scheduledTimeout);
      }
    };
  }, [scheduledTimeout]);

  const executeNode = async (
    node: WorkflowNode,
    nodeInput: string,
    retryCount = 0
  ): Promise<string> => {
    try {
      setExecutionStatuses(prev => 
        prev.map(status => 
          status.nodeId === node.id 
            ? { ...status, status: 'running' }
            : status
        )
      );

      const app = apps.find(a => a.appName === node.appName);
      if (!app) throw new Error(`App ${node.appName} not found`);

      const response = await generateCompletion({
        model: app.model,
        prompt: nodeInput,
        system: app.useSystemPrompt ? app.systemPrompt : undefined,
        options: {
          temperature: app.defaultTemperature,
          num_predict: app.maxTokens,
        },
      });

      const output = response.response;
      
      setExecutionStatuses(prev => 
        prev.map(status => 
          status.nodeId === node.id 
            ? { ...status, status: 'completed', output }
            : status
        )
      );

      return output;
    } catch (error) {
      console.error(`Error executing node ${node.id}:`, error);
      
      if (retryCount < MAX_RETRIES) {
        setExecutionStatuses(prev => 
          prev.map(status => 
            status.nodeId === node.id 
              ? { ...status, status: 'error', error: 'Retrying...' }
              : status
          )
        );

        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return executeNode(node, nodeInput, retryCount + 1);
      }

      setExecutionStatuses(prev => 
        prev.map(status => 
          status.nodeId === node.id 
            ? { 
                ...status, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                retries: retryCount
              }
            : status
        )
      );

      throw error;
    }
  };

  const executeWorkflow = async (workflowInput: string) => {
    if (!activeWorkflowData || isExecuting) return;

    setIsExecuting(true);
    setExecutionStatuses(
      activeWorkflowData.nodes.map(node => ({
        nodeId: node.id,
        status: 'pending',
        retries: 0
      }))
    );
    setFinalOutput('');

    const execution: WorkflowExecution = {
      input: workflowInput,
      nodes: [],
      timestamp: Date.now()
    };

    try {
      let currentInput = workflowInput;

      for (const node of activeWorkflowData.nodes) {
        const output = await executeNode(node, currentInput);
        
        execution.nodes.push({
          nodeId: node.id,
          input: currentInput,
          output,
          timestamp: Date.now()
        });

        currentInput = output;
      }

      setFinalOutput(currentInput);
      
      execution.finalOutput = currentInput;
      setExecutionHistory(prev => [execution, ...prev]);
    } catch (error) {
      console.error('Workflow execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const scheduleNextExecution = () => {
    if (!isScheduled) return;

    const now = new Date();
    let nextExecutionTime: Date;

    switch (scheduleConfig.type) {
      case 'interval':
        if (!scheduleConfig.interval) return;
        nextExecutionTime = new Date(now.getTime() + scheduleConfig.interval * 60000);
        break;

      case 'daily':
        if (!scheduleConfig.time) return;
        const [hours, minutes] = scheduleConfig.time.split(':').map(Number);
        nextExecutionTime = new Date(now);
        nextExecutionTime.setHours(hours, minutes, 0, 0);
        if (nextExecutionTime <= now) {
          nextExecutionTime.setDate(nextExecutionTime.getDate() + 1);
        }
        break;

      case 'weekly':
        if (!scheduleConfig.time || scheduleConfig.dayOfWeek === undefined) return;
        const [weeklyHours, weeklyMinutes] = scheduleConfig.time.split(':').map(Number);
        nextExecutionTime = new Date(now);
        nextExecutionTime.setHours(weeklyHours, weeklyMinutes, 0, 0);
        const daysUntilNext = (scheduleConfig.dayOfWeek - now.getDay() + 7) % 7;
        nextExecutionTime.setDate(nextExecutionTime.getDate() + daysUntilNext);
        if (nextExecutionTime <= now) {
          nextExecutionTime.setDate(nextExecutionTime.getDate() + 7);
        }
        break;

      case 'monthly':
        if (!scheduleConfig.time || !scheduleConfig.dayOfMonth) return;
        const [monthlyHours, monthlyMinutes] = scheduleConfig.time.split(':').map(Number);
        nextExecutionTime = new Date(now);
        nextExecutionTime.setDate(scheduleConfig.dayOfMonth);
        nextExecutionTime.setHours(monthlyHours, monthlyMinutes, 0, 0);
        if (nextExecutionTime <= now) {
          nextExecutionTime.setMonth(nextExecutionTime.getMonth() + 1);
        }
        break;

      default:
        return;
    }

    const timeout = setTimeout(() => {
      executeWorkflow(input);
      scheduleNextExecution();
    }, nextExecutionTime.getTime() - now.getTime());

    setScheduledTimeout(timeout);
  };

  const handleSchedule = () => {
    if (isScheduled) {
      if (scheduledTimeout) {
        clearTimeout(scheduledTimeout);
        setScheduledTimeout(null);
      }
      setIsScheduled(false);
      return;
    }

    switch (scheduleConfig.type) {
      case 'interval':
        if (!scheduleConfig.interval || scheduleConfig.interval < 1) {
          alert('Please enter a valid interval (minutes)');
          return;
        }
        break;
      case 'daily':
        if (!scheduleConfig.time) {
          alert('Please select a time for daily execution');
          return;
        }
        break;
      case 'weekly':
        if (!scheduleConfig.time || scheduleConfig.dayOfWeek === undefined) {
          alert('Please select a time and day for weekly execution');
          return;
        }
        break;
      case 'monthly':
        if (!scheduleConfig.time || !scheduleConfig.dayOfMonth) {
          alert('Please select a time and day for monthly execution');
          return;
        }
        break;
    }

    setIsScheduled(true);
    scheduleNextExecution();
  };

  if (!activeWorkflowData) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a workflow to execute
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold mb-4">{activeWorkflowData.name} - Execution</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg h-24"
              placeholder="Enter input for the workflow..."
              disabled={isExecuting}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => executeWorkflow(input)}
              disabled={isExecuting || !input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isExecuting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowScheduleConfig(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              disabled={isExecuting}
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </button>

            {isScheduled && (
              <button
                onClick={handleSchedule}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Schedule</span>
              </button>
            )}
          </div>
        </div>

        {finalOutput && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Final Output</h3>
            <div className="bg-white p-4 rounded border whitespace-pre-wrap">
              {finalOutput}
            </div>
          </div>
        )}
      </div>

      {showScheduleConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Schedule Configuration</h3>
              <button
                onClick={() => setShowScheduleConfig(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Type
                </label>
                <select
                  value={scheduleConfig.type}
                  onChange={(e) => setScheduleConfig({ type: e.target.value as ScheduleConfig['type'] })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="interval">Interval</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {scheduleConfig.type === 'interval' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interval (minutes)
                  </label>
                  <input
                    type="number"
                    value={scheduleConfig.interval || ''}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, interval: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              {(scheduleConfig.type === 'daily' || scheduleConfig.type === 'weekly' || scheduleConfig.type === 'monthly') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleConfig.time || ''}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              {scheduleConfig.type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={scheduleConfig.dayOfWeek || 0}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              )}

              {scheduleConfig.type === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Month
                  </label>
                  <input
                    type="number"
                    value={scheduleConfig.dayOfMonth || ''}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, dayOfMonth: parseInt(e.target.value) })}
                    min="1"
                    max="31"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowScheduleConfig(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowScheduleConfig(false);
                    handleSchedule();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Start Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-6 overflow-auto">
        <h3 className="text-lg font-semibold mb-4">Execution Status</h3>
        <div className="space-y-4">
          {executionStatuses.map((status, index) => {
            const node = activeWorkflowData.nodes.find(n => n.id === status.nodeId);
            const app = node ? apps.find(a => a.appName === node.appName) : null;

            return (
              <div key={status.nodeId} className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{app?.appName || 'Unknown App'}</span>
                    {status.status === 'pending' && (
                      <div className="text-gray-500">Pending</div>
                    )}
                    {status.status === 'running' && (
                      <div className="text-blue-500 flex items-center space-x-1">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Running</span>
                      </div>
                    )}
                    {status.status === 'completed' && (
                      <div className="text-green-500 flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Completed</span>
                      </div>
                    )}
                    {status.status === 'error' && (
                      <div className="text-red-500 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>Error</span>
                      </div>
                    )}
                  </div>
                  {status.retries > 0 && (
                    <div className="flex items-center text-gray-500 text-sm">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Retries: {status.retries}
                    </div>
                  )}
                </div>
                {status.error && (
                  <div className="text-sm text-red-500 mt-2">{status.error}</div>
                )}
                {status.output && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border text-sm">
                    <div className="font-medium text-gray-700 mb-1">Output:</div>
                    <div className="whitespace-pre-wrap">{status.output}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 border-t bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Execution History</h3>
        <div className="space-y-4">
          {executionHistory.map((execution, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm text-gray-500">
                    Input: {execution.input}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(execution.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {execution.nodes.map((node, nodeIndex) => {
                  const app = apps.find(a => a.appName === activeWorkflowData.nodes.find(n => n.id === node.nodeId)?.appName);
                  return (
                    <div key={node.nodeId} className="border-l-2 border-blue-200 pl-4">
                      <div className="font-medium text-gray-700">{app?.appName}</div>
                      <div className="text-sm mt-1">
                        <div className="text-gray-500">Input:</div>
                        <div className="whitespace-pre-wrap">{node.input}</div>
                        <div className="text-gray-500 mt-2">Output:</div>
                        <div className="whitespace-pre-wrap">{node.output}</div>
                      </div>
                    </div>
                  );
                })}
                
                {execution.finalOutput && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-medium text-green-700 mb-2">Final Output</div>
                    <div className="whitespace-pre-wrap">{execution.finalOutput}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};