# Mission Runner OS 🚀

> **Tactical Developer Operating System Node**

Mission Runner is a client-side developer operating system that transforms virtual workspace records, executes structured multi-model prompts, and runs code directives securely inside your browser or native companion shell.

---

## 🌌 Core Concept
Everything begins inside Mission Runner. It acts as a personal local development engine where repositories, AI instructions, virtual files, and configuration state are consolidated, audited, and committed entirely client-side.

---

## 📁 Repository Structure
The repository is structured to separate the browser-first platform from native companion legacy assets:

```text
/
├── app/                  # Secondary legacy Android companion wrapper
├── web/                  # Primary Browser OS Product (PWA Offline ready)
│   ├── index.html        # Single-file developer dashboard, UI & modules
│   ├── manifest.json     # PWA identification and configuration
│   └── sw.js             # Service Worker cache node for offline operations
├── mission/              # Prompt operations schemas & templates
│   ├── schema/           # Prompt validator schemas
│   ├── templates/        # Template instruction modules
│   ├── commands/         # Actions registry specifications
│   └── examples/         # Complex pipeline workflow files
├── docs/                 # General architectural decisions & design notes
└── README.md             # This document
```

---

## 🛠️ Architecture Modules
Mission Runner is structured into logical internal modules, fully decoupled and executing over a centralized event loop:

- **Core Loop**: Synchronizes UI lifecycles and tick rates.
- **Event Bus**: The primary messaging bus. No module couples directly with other parts of the codebase.
- **Storage Node**: Handles persistent key-value configuration caches.
- **State Manager**: Controls global UI rendering status, active workspace state, and operational queue variables.
- **AI Gateway Abstraction**: Integrates Gemini, DeepSeek, OpenAI, Groq, Together, and local Ollama/LM Studio servers seamlessly under a standard model-selector interface.
- **Execution Pipeline**: Takes parsed directive queues, validates parameters, and runs operations sequentially.
- **Virtual File System**: Standardizes tree rendering, tab management, and real-time node modification logs.

---

## 🕹️ Primary Interfaces

### Mode 1: Direct Action Deck (Quick Mode)
Large, touch-friendly, highly responsive control nodes designed for immediate operational control without requiring manual prompt inputs:
- **Workspace Navigation**: Browse and load local repos.
- **Record Management**: Create, edit, rename, and purge virtual source files.
- **Transport controls**: Pull updates, stage buffers, commit diffs, and deploy pipelines.

### Mode 2: Prompt Command Processor
A structured, multi-line command engine that parses LLM-generated instructions locally in the browser sandbox.

---

## 📝 Prompt Instruction Language
Mission Runner executes structured instruction blocks sequentially. 

### Syntax Reference:
```text
COMMENT: [User facing status message]
CREATE: [virtual path]
[file contents...]

REPLACE: [virtual path]
TARGET: [exact match search line]
REPLACEMENT: [upgraded substitution line]
END:

DELETE: [virtual path]
```

---

## 🌐 GitHub Pages Deployment
Publish your Mission Runner compiler node directly to GitHub Pages:
1. Navigate to your repository's settings on GitHub.
2. Select **Pages** from the sidebar.
3. Under **Build and deployment**, configure the source to deploy from the `web/` directory.
4. Your application will be accessible at: `https://<github-user>.github.io/<repository>/web/`

---

## 🛡️ Virtual Security Sandbox
- All virtual repository records are managed locally in sandboxed `localStorage` structures.
- API keys are locked in browser-level variables and never relayed to third-party endpoints other than your configured model gateways.
