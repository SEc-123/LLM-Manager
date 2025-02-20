import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Download, Loader, RefreshCw, Trash2 } from 'lucide-react';
import { checkOllamaService, listModels, pullModel, deleteModel, OllamaModel } from '../services/ollama';

export const ModelManager: React.FC = () => {
  const [isOllamaAvailable, setIsOllamaAvailable] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState(true);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pullProgress, setPullProgress] = useState<{
    [key: string]: { status: string; percentage?: number };
  }>({});

  // 检查Ollama服务状态
  const checkService = async () => {
    setIsChecking(true);
    const available = await checkOllamaService();
    setIsOllamaAvailable(available);
    setIsChecking(false);
    if (available) {
      refreshModels();
    }
  };

  // 刷新模型列表
  const refreshModels = async () => {
    try {
      setIsLoading(true);
      const models = await listModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 拉取模型
  const handlePullModel = async (modelName: string) => {
    try {
      setPullProgress(prev => ({
        ...prev,
        [modelName]: { status: 'Starting download...' }
      }));

      await pullModel(modelName, (progress) => {
        setPullProgress(prev => ({
          ...prev,
          [modelName]: {
            status: progress.status,
            percentage: progress.percentage
          }
        }));
      });

      refreshModels();
    } catch (error) {
      setPullProgress(prev => ({
        ...prev,
        [modelName]: { status: 'Error: ' + (error instanceof Error ? error.message : String(error)) }
      }));
    }
  };

  // 删除模型
  const handleDeleteModel = async (modelName: string) => {
    if (!confirm(\`Are you sure you want to delete \${modelName}?\`)) return;
    
    try {
      await deleteModel(modelName);
      refreshModels();
    } catch (error) {
      console.error('Error deleting model:', error);
    }
  };

  useEffect(() => {
    checkService();
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2">
          <Loader className="w-5 h-5 animate-spin text-blue-500" />
          <span>Checking Ollama service...</span>
        </div>
      </div>
    );
  }

  if (!isOllamaAvailable) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="flex items-center space-x-2 text-red-500">
          <AlertCircle className="w-6 h-6" />
          <span className="text-lg">Ollama service is not available</span>
        </div>
        <p className="text-gray-600 text-center max-w-md">
          Please make sure Ollama is installed and running on your system.
          You can download it from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">ollama.ai</a>
        </p>
        <button
          onClick={checkService}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-lg font-semibold">Ollama Service Connected</span>
        </div>
        <button
          onClick={refreshModels}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw className={\`w-4 h-4 \${isLoading ? 'animate-spin' : ''}\`} />
          <span>Refresh Models</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 常用模型快速拉取 */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold mb-4">Recommended Models</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['deepseek-coder:6.7b', 'codellama:7b', 'llama2:7b'].map((model) => {
              const isInstalled = availableModels.some(m => m.name === model);
              const progress = pullProgress[model];

              return (
                <div key={model} className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{model}</h4>
                    {isInstalled && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded">
                        Installed
                      </span>
                    )}
                  </div>
                  
                  {progress && !isInstalled && (
                    <div className="mb-2">
                      <div className="text-sm text-gray-600">{progress.status}</div>
                      {progress.percentage !== undefined && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-500 rounded-full h-2"
                            style={{ width: \`\${progress.percentage}%\` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {!isInstalled && (
                      <button
                        onClick={() => handlePullModel(model)}
                        disabled={!!progress}
                        className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Install</span>
                      </button>
                    )}
                    {isInstalled && (
                      <button
                        onClick={() => handleDeleteModel(model)}
                        className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 已安装模型列表 */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold mb-4">Installed Models</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableModels.map((model) => (
              <div key={model.name} className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium">{model.name}</h4>
                    <p className="text-sm text-gray-500">
                      Size: {(model.size / (1024 * 1024 * 1024)).toFixed(2)} GB
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteModel(model.name)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {model.details && (
                  <div className="text-sm text-gray-600">
                    <p>Format: {model.details.format}</p>
                    <p>Family: {model.details.family}</p>
                    <p>Parameters: {model.details.parameter_size}</p>
                    <p>Quantization: {model.details.quantization_level}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};