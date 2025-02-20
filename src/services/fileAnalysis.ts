import { FileAnalysisConfig } from '../types';
import { fileTypeFromBuffer } from 'file-type';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

export interface FileInfo {
  path: string;
  content: string;
  size: number;
  type: string;
  mimeType: string;
  lastModified: Date;
}

interface AnalysisSummary {
  totalFiles: number;
  totalSize: number;
  fileTypes: { [key: string]: number };
  directories: string[];
}

export class FileAnalysisService {
  private config: FileAnalysisConfig;
  private tesseractWorker: Tesseract.Worker | null = null;

  constructor(config: FileAnalysisConfig) {
    this.config = config;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  private async initTesseractWorker() {
    if (!this.tesseractWorker) {
      this.tesseractWorker = await createWorker('eng');
    }
    return this.tesseractWorker;
  }

  private shouldIncludeFile(path: string, size: number): boolean {
    if (size > this.config.maxFileSizeKB * 1024) {
      return false;
    }

    if (this.config.excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*'));
      return regex.test(path);
    })) {
      return false;
    }

    if (this.config.fileTypes.length > 0 && !this.config.fileTypes.includes('*')) {
      const extension = path.substring(path.lastIndexOf('.')).toLowerCase();
      return this.config.fileTypes.some(type => 
        type.startsWith('.') ? extension === type.toLowerCase() : extension === `.${type.toLowerCase()}`
      );
    }

    return true;
  }

  private async detectFileType(file: File): Promise<{ type: string; mimeType: string }> {
    // 首先检查文件的 MIME 类型
    const mimeType = file.type;

    // 使用 file-type 库检查文件的 magic bytes
    const buffer = await file.arrayBuffer();
    const fileType = await fileTypeFromBuffer(buffer);

    // 如果 file-type 能识别文件类型，使用它的结果
    if (fileType) {
      return {
        type: fileType.ext.toUpperCase(),
        mimeType: fileType.mime
      };
    }

    // 如果无法通过 magic bytes 识别，使用文件扩展名
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    // 映射文件扩展名到类型
    const typeMap: { [key: string]: string } = {
      // 编程语言
      '.py': 'PYTHON',
      '.ipynb': 'JUPYTER_NOTEBOOK',
      '.js': 'JAVASCRIPT',
      '.jsx': 'REACT_JSX',
      '.ts': 'TYPESCRIPT',
      '.tsx': 'REACT_TSX',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SASS',
      '.sass': 'SASS',
      '.java': 'JAVA',
      '.class': 'JAVA_BYTECODE',
      '.jar': 'JAVA_ARCHIVE',
      '.c': 'C',
      '.h': 'C_HEADER',
      '.cpp': 'CPP',
      '.hpp': 'CPP_HEADER',
      '.cs': 'CSHARP',
      '.php': 'PHP',
      '.sh': 'SHELL',
      '.bash': 'BASH',
      '.sql': 'SQL',
      '.rb': 'RUBY',
      '.swift': 'SWIFT',
      '.kt': 'KOTLIN',
      '.kts': 'KOTLIN_SCRIPT',
      '.go': 'GO',
      '.rs': 'RUST',
      '.lua': 'LUA',

      // 文档和配置
      '.md': 'MARKDOWN',
      '.rst': 'RST',
      '.json': 'JSON',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.toml': 'TOML',
      '.ini': 'INI',
      '.env': 'ENV',

      // 构建和脚本
      '.bat': 'WINDOWS_BATCH',
      '.cmd': 'WINDOWS_BATCH',
      '.makefile': 'MAKEFILE',
      '.dockerfile': 'DOCKERFILE',
      '.gradle': 'GRADLE',
      '.xml': 'XML',

      // 数据文件
      '.csv': 'CSV',
      '.txt': 'TEXT',
      '.log': 'LOG',
      '.pdf': 'PDF',
    };

    return {
      type: typeMap[extension] || 'UNKNOWN',
      mimeType: mimeType || 'application/octet-stream'
    };
  }

  private async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }

    return text;
  }

  private async extractTextFromImage(file: File): Promise<string> {
    const worker = await this.initTesseractWorker();
    const result = await worker.recognize(file);
    return result.data.text;
  }

  private async readFileContent(file: File, type: string, mimeType: string): Promise<string> {
    try {
      // 处理二进制文件
      if (mimeType.startsWith('image/')) {
        return await this.extractTextFromImage(file);
      }
      
      if (type === 'PDF') {
        return await this.extractTextFromPDF(file);
      }

      // 处理文本文件
      const text = await file.text();
      return text.length > 100000 ? text.substring(0, 100000) + '...(truncated)' : text;
    } catch (error) {
      console.error(`Error reading file ${file.name}:`, error);
      return '';
    }
  }

  async analyzeFiles(): Promise<{
    files: FileInfo[];
    summary: AnalysisSummary;
  }> {
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read'
      });

      const files: FileInfo[] = [];
      const directories: Set<string> = new Set();

      const processDirectory = async (handle: FileSystemDirectoryHandle, path = ''): Promise<void> => {
        for await (const entry of handle.values()) {
          const entryPath = path ? `${path}/${entry.name}` : entry.name;

          if (entry.kind === 'directory') {
            directories.add(entryPath);
            if (this.config.includeSubdirectories) {
              if (!this.config.excludePatterns.some(pattern => {
                const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*'));
                return regex.test(entryPath);
              })) {
                await processDirectory(entry, entryPath);
              }
            }
          } else {
            try {
              const file = await entry.getFile();
              if (this.shouldIncludeFile(entryPath, file.size)) {
                const { type, mimeType } = await this.detectFileType(file);
                const content = await this.readFileContent(file, type, mimeType);
                
                files.push({
                  path: entryPath,
                  content,
                  size: file.size,
                  type,
                  mimeType,
                  lastModified: new Date(file.lastModified)
                });
              }
            } catch (error) {
              console.error(`Error processing file ${entryPath}:`, error);
            }
          }
        }
      };

      await processDirectory(dirHandle);

      const summary: AnalysisSummary = {
        totalFiles: files.length,
        totalSize: files.reduce((acc, file) => acc + file.size, 0),
        fileTypes: files.reduce((acc, file) => {
          acc[file.type] = (acc[file.type] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }),
        directories: Array.from(directories)
      };

      return { files, summary };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      console.error('Error analyzing files:', error);
      throw new Error('Failed to analyze files. Please check your permissions and try again.');
    } finally {
      if (this.tesseractWorker) {
        await this.tesseractWorker.terminate();
        this.tesseractWorker = null;
      }
    }
  }

  async analyzeContent(files: FileInfo[]): Promise<string> {
    const sortedFiles = files
      .sort((a, b) => a.size - b.size)
      .filter(file => file.content.trim().length > 0);

    let totalSize = 0;
    const maxTotalSize = 1024 * 1024;
    const selectedFiles: FileInfo[] = [];

    for (const file of sortedFiles) {
      if (totalSize + file.content.length <= maxTotalSize) {
        selectedFiles.push(file);
        totalSize += file.content.length;
      } else {
        break;
      }
    }

    const summary = selectedFiles.map(file => {
      const truncatedContent = file.content.length > 10000 
        ? file.content.substring(0, 10000) + '...(truncated)'
        : file.content;

      let analysis = `File: ${file.path}\nType: ${file.type}\nMIME: ${file.mimeType}\nSize: ${(file.size / 1024).toFixed(2)} KB\n\n`;
      
      switch (file.type) {
        case 'JSON':
          try {
            const json = JSON.parse(file.content);
            analysis += `Structure: ${typeof json === 'object' ? (Array.isArray(json) ? 'Array' : 'Object') : 'Invalid'}\n`;
            analysis += `Keys: ${Object.keys(json).join(', ')}\n`;
          } catch {
            analysis += 'Invalid JSON format\n';
          }
          break;

        case 'CSV':
          const lines = file.content.split('\n');
          if (lines.length > 0) {
            analysis += `Headers: ${lines[0]}\n`;
            analysis += `Row count: ${lines.length - 1}\n`;
          }
          break;

        case 'PYTHON':
        case 'JAVASCRIPT':
        case 'TYPESCRIPT':
        case 'JAVA':
        case 'CPP':
        case 'CSHARP':
          const functionMatches = file.content.match(/function\s+\w+|def\s+\w+|class\s+\w+|void\s+\w+\s*\(|public\s+\w+\s*\(/g);
          if (functionMatches) {
            analysis += `Functions/Classes found: ${functionMatches.length}\n`;
            analysis += `Names: ${functionMatches.join(', ')}\n`;
          }

          const importMatches = file.content.match(/import\s+.*?;|from\s+.*?import|#include\s+[<"].*?[>"]/g);
          if (importMatches) {
            analysis += `\nImports/Includes: ${importMatches.length}\n`;
            analysis += importMatches.join('\n') + '\n';
          }
          break;

        case 'HTML':
          const tagMatches = file.content.match(/<[a-zA-Z0-9]+/g);
          if (tagMatches) {
            const tagCounts = tagMatches.reduce((acc: {[key: string]: number}, tag) => {
              const tagName = tag.slice(1);
              acc[tagName] = (acc[tagName] || 0) + 1;
              return acc;
            }, {});
            analysis += 'HTML Elements:\n';
            Object.entries(tagCounts).forEach(([tag, count]) => {
              analysis += `${tag}: ${count}\n`;
            });
          }
          break;

        case 'CSS':
        case 'SASS':
          const selectorMatches = file.content.match(/[.#]?[a-zA-Z0-9_-]+\s*{/g);
          if (selectorMatches) {
            analysis += `Selectors found: ${selectorMatches.length}\n`;
            analysis += `Sample selectors: ${selectorMatches.slice(0, 5).join(', ')}\n`;
          }
          break;

        case 'SQL':
          const tableMatches = file.content.match(/create\s+table\s+\w+|select\s+.*?\s+from\s+\w+/gi);
          if (tableMatches) {
            analysis += `SQL Operations found: ${tableMatches.length}\n`;
            analysis += `Sample operations:\n${tableMatches.slice(0, 5).join('\n')}\n`;
          }
          break;

        case 'YAML':
          const yamlKeys = file.content.match(/^\s*[\w-]+:/gm);
          if (yamlKeys) {
            analysis += `Top-level keys: ${yamlKeys.length}\n`;
            analysis += `Keys: ${yamlKeys.map(k => k.trim().slice(0, -1)).join(', ')}\n`;
          }
          break;

        case 'PDF':
        case 'IMAGE':
          analysis += 'Extracted text content:\n';
          analysis += truncatedContent;
          break;
      }

      analysis += `\nContent:\n${truncatedContent}\n\n---\n\n`;
      return analysis;
    }).join('');

    return summary;
  }
}