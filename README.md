# LLM Manager

Local LLM Manager is a powerful and practical enterprise-grade tool for managing local large language models (LLMs). It works exclusively with Ollama, requiring you to download and install Ollama, set up your preferred models, and configure them within the tool to start using AI locally. With this tool, you can create custom AI applications similar to GPTs, tailoring different models and prompts for specific tasks. Additionally, you can chain multiple GPT-like applications together, enabling seamless AI-driven workflows that automate complex processes. 🚀

## Features
Local LLM Manager: A Comprehensive Local AI Management Tool
Local LLM Manager is an enterprise-grade tool designed for managing local large language models (LLMs) efficiently. Built to work seamlessly with Ollama, this tool empowers users to create custom AI applications, design automated workflows, and analyze specific file paths—all while keeping AI processing local for enhanced security and performance.

🔹 1. Create Local AI Custom Applications
With Local LLM Manager, you can create custom AI applications using predefined prompts tailored to your specific needs. Instead of relying on cloud-based AI models, you can set up local LLMs with personalized behavior, optimizing them for tasks such as:

Code Assistance – AI-powered coding helpers with predefined prompts.
Writing Assistants – AI-enhanced tools for document generation and editing.
Data Processing – Structured AI responses based on predefined input formats.
By configuring different models, prompts, temperature settings, and max token limits, you gain full control over how your custom AI applications interact with your data.

🔹 2. Create Automated AI Workflows
Beyond standalone applications, Local LLM Manager enables you to combine multiple AI applications into automated workflows. This feature allows you to:

✅ Chain AI tools together – Pass output from one AI application to another, creating a multi-step processing pipeline.

✅ Customize execution logic – Define how different applications interact to handle complex AI-driven tasks.

✅ Schedule tasks – Automate execution at specific times, ensuring continuous workflow processing without manual intervention.

For example, you can create a workflow where:

An AI assistant extracts insights from a document,
Then sends the summarized text to a writing assistant for reformatting,
Finally, an automated reviewer checks the text for compliance before sending it to the user.
This workflow automation makes AI integration more dynamic and efficient, streamlining repetitive processes.

🔹 3. Analyze Files & Subdirectories in Custom Paths
A standout feature of Local LLM Manager is its file analysis capability. When creating a custom AI application, you can specify a target file path and subdirectories for the model to access and analyze.

This is particularly useful for:

Security File Monitoring – AI continuously scans specified folders for anomalies or security threats.
Project Code Audits – Automate AI-driven code reviews, ensuring best practices and detecting vulnerabilities.
Document Processing – Extract and summarize information from large repositories of files.
By defining specific file types, exclusion patterns, and size limits, you can fine-tune how Local LLM Manager interacts with your local file system, making it a powerful tool for AI-assisted file management and auditing.

🔹 4. Example: AI-Powered Code Auditing

One powerful use case of Local LLM Manager is automated code auditing. By leveraging local LLMs, you can create a custom AI application that:

1️⃣ Scans a project's file structure – Identifies relevant code files and dependencies.

2️⃣ Analyzes project modules and functionality – Understands the architecture and relationships between components.

3️⃣ Performs an AI-driven security audit – Detects potential vulnerabilities, such as SQL injection, XSS, hardcoded secrets, and insecure API calls.

4️⃣ Generates structured analysis results – Summarizes findings and provides recommended fixes.

5️⃣ Outputs a Markdown report – Creates a well-structured security audit report that can be reviewed and shared easily.

![image](https://github.com/user-attachments/assets/52ad5c42-c5d3-4cdc-bfde-c7e8f115f87d)
![image](https://github.com/user-attachments/assets/98b2d249-6e27-46c8-92f3-f26b8458bd59)
![image](https://github.com/user-attachments/assets/8aa17e86-8463-4489-86ce-996248057546)
![image](https://github.com/user-attachments/assets/ca670740-0254-45f4-9cda-a4c8bf5bedb8)

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
