# LLM Manager

A powerful and flexible application for managing and orchestrating Large Language Models (LLMs) through customizable workflows and applications.

online demo without Ai_model：

https://llmmanager.netlify.app/
## Features

### 1. Application Management

#### Model Configuration
- Support for multiple LLM models
- Configurable parameters:
  - Temperature control
  - Maximum token limits
  - Custom system prompts

#### Prompt Templates
- Create and manage reusable prompt templates
- Support for system prompts and user prompts
- Template variables for dynamic content

#### File Analysis
- Advanced file type detection using magic bytes and MIME types
- Support for binary files (PDF, images) with text extraction
- Configurable options:
  - File type filtering with extensive format support
  - Exclude patterns for ignoring files/directories
  - Maximum file size limits
  - Subdirectory inclusion (default: enabled)
  - Path specification with folder browser

##### Supported File Types
1. Programming Languages
   - Python (.py, .ipynb)
   - JavaScript/TypeScript (.js, .jsx, .ts, .tsx)
   - HTML/CSS (.html, .css, .scss, .sass)
   - Java (.java, .class, .jar)
   - C/C++ (.c, .h, .cpp, .hpp)
   - C# (.cs)
   - PHP (.php)
   - Shell Scripts (.sh, .bash)
   - SQL (.sql)
   - Ruby (.rb)
   - Swift (.swift)
   - Kotlin (.kt, .kts)
   - Go (.go)
   - Rust (.rs)
   - Lua (.lua)

2. Documents & Configuration
   - Markdown (.md)
   - reStructuredText (.rst)
   - JSON (.json)
   - YAML (.yaml, .yml)
   - TOML (.toml)
   - INI (.ini)
   - Environment Files (.env)

3. Build & Scripts
   - Windows Batch (.bat, .cmd)
   - Makefiles
   - Dockerfiles
   - Gradle/Maven
   - XML

4. Binary Files
   - PDF with text extraction
   - Images with OCR support
   - Binary file analysis with magic bytes detection

##### Analysis Features
- Content Analysis
  - Code structure analysis (functions, classes, imports)
  - HTML element analysis
  - CSS selector analysis
  - SQL query analysis
  - JSON/YAML structure analysis
  - PDF text extraction
  - Image OCR processing
- File Statistics
  - Total file count and size
  - File type distribution
  - Directory structure
- Performance Optimization
  - Async file processing
  - Memory usage management
  - Large file handling
  - Worker thread utilization

### 2. Workflow Management

#### Workflow Creation
- Drag-and-drop interface for building workflows
- Connect multiple applications in sequence
- Visual workflow representation with arrows
- Save and name workflows for future use

#### Workflow Organization
- Pin important workflows to the sidebar
- Organize workflows into pinned and unpinned sections
- Quick access to frequently used workflows
- Workflow node count display

#### Workflow Execution
- Execute workflows with custom inputs
- Real-time execution status monitoring
- Error handling with automatic retries
- Detailed execution history

### 3. Scheduling

#### Schedule Types
- Interval-based execution
- Daily scheduling
- Weekly scheduling
- Monthly scheduling

#### Schedule Configuration
- Custom time selection
- Day of week selection for weekly schedules
- Day of month selection for monthly schedules
- Interval duration in minutes

### 4. Chat Interface

- Real-time streaming responses
- Message history with timestamps
- Clear chat history option
- System and user message differentiation
- Error handling and retry mechanisms
- Loading states and progress indicators

## Interface Components

### Sidebar
- Application list
- Workflow management
- Settings access
- Pinned workflows section
- Quick navigation

### Main Content Area
1. Chat View
   - Message input
   - Chat history
   - Real-time response streaming
   - Error handling

2. Workflow Editor
   - Drag-and-drop canvas
   - Node configuration
   - Visual connections
   - Available applications panel

3. Workflow Executor
   - Input configuration
   - Execution controls
   - Status monitoring
   - History view

### Settings Panel
- Model configuration
- Prompt template management
- Application settings
- File analysis configuration

## Technical Details

### File Analysis Configuration
```typescript
interface FileAnalysisConfig {
  fileTypes: string[];        // Default: ['*']
  excludePatterns: string[];  // Default: []
  maxFileSizeKB: number;     // Default: 1024
  includeSubdirectories: boolean; // Default: true
}
```

### Workflow Structure
```typescript
interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  isPinned?: boolean;
}

interface WorkflowNode {
  id: string;
  appName: string;
  position: number;
}
```

### Application Configuration
```typescript
interface AppConfig {
  appName: string;
  model: string;
  prompt: string;
  defaultTemperature: number;
  maxTokens: number;
  useSystemPrompt: boolean;
  systemPrompt?: string;
  fileAnalysis?: FileAnalysisConfig;
}
```

## Usage Examples

### Creating a New Application
1. Open Settings
2. Navigate to Applications tab
3. Click "Add Application"
4. Configure:
   - Application name
   - Model selection
   - Temperature and token settings
   - System prompt (optional)
   - File analysis settings (optional)

### Building a Workflow
1. Create a new workflow
2. Drag applications from the bottom panel
3. Arrange them in sequence
4. Configure each node as needed
5. Save the workflow with a name
6. Pin if frequently used

### Scheduling a Workflow
1. Open workflow executor
2. Click "Schedule"
3. Select schedule type:
   - Interval
   - Daily
   - Weekly
   - Monthly
4. Configure time and frequency
5. Start schedule

### File Analysis Setup
1. Open application settings
2. Add file analysis configuration
3. Configure:
   - File types
   - Exclude patterns
   - Size limits
   - Subdirectory inclusion
4. Click "Select Directory" to start analysis
5. Review analysis results:
   - File statistics
   - Content analysis
   - Directory structure

## Best Practices

1. Workflow Organization
   - Pin frequently used workflows
   - Use descriptive workflow names
   - Keep workflows focused and modular

2. Application Configuration
   - Start with conservative temperature settings
   - Set appropriate token limits
   - Use system prompts for consistent behavior

3. File Analysis
   - Set appropriate file type filters
   - Use exclude patterns for irrelevant directories
   - Set reasonable file size limits
   - Enable subdirectories for comprehensive analysis

4. Scheduling
   - Consider server load for interval scheduling
   - Use appropriate retry settings
   - Monitor execution history

## Future Enhancements

1. Enhanced Workflow Features
   - Branching logic
   - Conditional execution
   - Parallel processing

2. Advanced Scheduling
   - Cron expression support
   - Timezone management
   - Holiday handling

3. Monitoring and Analytics
   - Usage statistics
   - Performance metrics
   - Cost tracking

4. Integration Capabilities
   - API endpoints
   - Webhook support
   - External service connections

5. File Analysis Improvements
   - More file format support
   - Advanced code analysis
   - Custom analysis rules
   - Batch processing capabilities
