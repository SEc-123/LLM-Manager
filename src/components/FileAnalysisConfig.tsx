import React, { useState, useEffect } from 'react';
import { FolderOpen, Loader, AlertCircle, CheckCircle, X, FileText, RefreshCw } from 'lucide-react';
import { FileAnalysisConfig as FileAnalysisConfigType, FileAnalysisResult } from '../types';
import { FileAnalysisService } from '../services/fileAnalysis';

interface Props {
  config: FileAnalysisConfigType;
  analysisResult?: FileAnalysisResult;
  onChange: (config: FileAnalysisConfigType) => void;
  onRemove: () => void;
  onAnalysisComplete?: (result: FileAnalysisResult) => void;
}

export const FileAnalysisConfig: React.FC<Props> = ({ 
  config, 
  analysisResult: savedResult,
  onChange, 
  onRemove, 
  onAnalysisComplete 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FileAnalysisResult | null>(
    savedResult || null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnalysisResult(savedResult || null);
  }, [savedResult]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const fileAnalysisService = new FileAnalysisService(config);
      const { files, summary } = await fileAnalysisService.analyzeFiles();
      const content = await fileAnalysisService.analyzeContent(files);
      
      const result: FileAnalysisResult = {
        files,
        summary,
        content,
        timestamp: Date.now()
      };

      setAnalysisResult(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setIsAnalyzing(false);
        return;
      }
      console.error('Error analyzing files:', error);
      setError('Failed to analyze files. Please check your permissions and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">File Analysis Configuration</h3>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-gray-600"
          title="Remove configuration"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Analyze Files
          </label>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : analysisResult ? (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Re-analyze Directory</span>
              </>
            ) : (
              <>
                <FolderOpen className="w-5 h-5" />
                <span>Select Directory</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {analysisResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-700 font-medium">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Analysis Complete</span>
              </div>
              <span className="text-sm text-gray-500">
                {formatTimestamp(analysisResult.timestamp)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Files</p>
                <p className="text-lg font-medium">{analysisResult.summary.totalFiles}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Size</p>
                <p className="text-lg font-medium">
                  {(analysisResult.summary.totalSize / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">File Types</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(analysisResult.summary.fileTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-gray-600">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {analysisResult.summary.directories.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Directories</p>
                <div className="text-sm text-gray-600 space-y-1 max-h-40 overflow-auto">
                  {analysisResult.summary.directories.map(dir => (
                    <p key={dir} className="truncate">{dir}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className="flex items-center space-x-2 text-blue-600">
                <FileText className="w-5 h-5" />
                <span className="font-medium">Content Analysis Ready</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                The content analysis has been prepared and will be used for the next interaction.
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Types
          </label>
          <input
            type="text"
            value={config.fileTypes.join(', ')}
            onChange={(e) =>
              onChange({
                ...config,
                fileTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })
            }
            placeholder="Leave empty to analyze all files, or specify extensions like .js, .ts, .tsx"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Separate file extensions with commas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exclude Patterns
          </label>
          <input
            type="text"
            value={config.excludePatterns.join(', ')}
            onChange={(e) =>
              onChange({
                ...config,
                excludePatterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })
            }
            placeholder="e.g., node_modules, .git"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Patterns to exclude from analysis
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max File Size (KB)
          </label>
          <input
            type="number"
            value={config.maxFileSizeKB}
            onChange={(e) =>
              onChange({
                ...config,
                maxFileSizeKB: parseInt(e.target.value)
              })
            }
            min="1"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.includeSubdirectories}
            onChange={(e) =>
              onChange({
                ...config,
                includeSubdirectories: e.target.checked
              })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm text-gray-700">
            Include Subdirectories
          </label>
        </div>
      </div>
    </div>
  );
};