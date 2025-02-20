# LLM Manager

A powerful and flexible application for managing and orchestrating Large Language Models (LLMs) through customizable workflows and applications.

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
- Analyze files in specified directories
- Configurable options:
  - File type filtering (default: all files)
  - Exclude patterns for ignoring files/directories
  - Maximum file size limits
  - Subdirectory inclusion (default: enabled)
  - Path specification with folder browser

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

- Real-time chat with LLM applications
- Message history with timestamps
- Clear chat history option
- System and user message differentiation

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
   - Application info

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
  path: string;
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
   - Target path
   - File types (default: all)
   - Exclude patterns
   - Size limits
   - Subdirectory inclusion

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
   - Exclude unnecessary directories
   - Set reasonable file size limits
   - Use specific file types when possible

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