# ✦ BlogSmith

> **Autonomous Multi-Agent Technical Blog Publisher**  
> Orchestrated with **LangGraph 1.2**, powered by **Groq** and **Google Gemini**, with real-time observable streaming via **FastAPI**.

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.2.2-emerald.svg)](https://github.com/langchain-ai/langgraph)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688.svg)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-Fast_Inference-orange.svg)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Overview

**BlogSmith** is an end-to-end autonomous publishing engine designed to transform technical topics into publication-ready, citation-backed long-form articles. 

Unlike single-prompt LLM wrappers, BlogSmith executes a formal **Multi-Agent Directed Acyclic Graph (DAG)** with **Map-Reduce Fanout**:
1. **Intelligent Router**: Analyzes topic complexity to select `closed_book`, `open_book`, or `hybrid` mode.
2. **Research Agent (Tavily)**: Dispatches targeted web queries, truncates snippets, and deduplicates an authoritative evidence pack.
3. **Orchestrator Agent**: Synthesizes a structured editorial outline with audience parameters, constraints, target word counts, and discrete section tasks.
4. **Parallel Section Workers (Fanout)**: Employs LangGraph’s `Send` API to author independent sections concurrently.
5. **Reducer Subgraph**: Merges draft sections in order, plans technical diagrams, calls Gemini to generate visual assets, and embeds them into final Markdown.
6. **Editorial Studio UI**: An interactive, dark-mode dashboard providing live DAG stepping, parallel worker progress monitoring, evidence inspection, and dual-view article editing.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    START([Start]) --> Router[1. Router Node]
    
    Router -->|needs_research = True| Research[2. Research Agent\nTavily Search]
    Router -->|needs_research = False| Orch[3. Orchestrator\nEditorial Outline]
    Research --> Orch
    
    Orch -->|fanout via Send API| Worker1[Worker #1\nSection Draft]
    Orch -->|fanout via Send API| Worker2[Worker #2\nSection Draft]
    Orch -->|fanout via Send API| WorkerN[Worker #N\nSection Draft]
    
    Worker1 --> Reducer[4. Reducer Subgraph]
    Worker2 --> Reducer
    WorkerN --> Reducer
    
    subgraph Reducer [Reducer Subgraph]
        Merge[Merge Sections] --> DecideImg[Plan Visual Diagrams]
        DecideImg --> GenImg[Gemini Flash Image Generation\n& Placeholder Placement]
    end
    
    Reducer --> END([Final Markdown])
```

---

## ✨ Key Features

* **Multi-Agent Map-Reduce**: Uses LangGraph's dynamic `Send` primitives to execute parallel section drafting without blocking the main workflow.
* **Token-Optimized Research Pipeline**: Deduplicates URLs and compresses web snippets before structured LLM extraction, cutting token consumption by 95% to avoid rate limits.
* **Resilient PostgreSQL Checkpointer**: Integrates `PostgresSaver` with `psycopg_pool.ConnectionPool` for persistent, thread-safe graph checkpoints and automatic reconnection, falling back to `MemorySaver` when offline.
* **Bespoke Editorial Studio**: A dark-mode frontend built with custom HTML, CSS, and vanilla JS (no generic templates):
  * Real-time Server-Sent Events (SSE) streaming through `fetch` + `ReadableStream`.
  * Live visual DAG stepper with pulsing execution states.
  * Interactive parallel workers progress matrix.
  * Tabbed Inspector: Structured Outline, Scraped Evidence links with snippets, and Visual Diagram specs.
  * Rendered Article View (with syntax-highlighted code and zoomable diagram lightbox) + Raw Markdown Source view.
  * Instant Markdown copy and `.md` file download.

---

## 📁 Project Structure

```text
Blog_Agent/
├── app.py                     # FastAPI server with SSE streaming & endpoints
├── requirements.txt           # Project dependencies
├── .env                       # Environment secrets (API keys & DB URL)
├── .gitignore                 # Protected ignore rules (prevents .env leaks)
│
├── backend/
│   ├── __init__.py            # Package export for compiled workflow
│   ├── graph.py               # LangGraph DAG definition & connection pooling
│   ├── nodes.py               # Node functions (router, research, orchestrator, workers, reducer)
│   ├── model.py               # Groq ChatGroq LLM initialization
│   ├── schema.py              # Pydantic schemas (State, Plan, Task, EvidencePack, etc.)
│   ├── prompt.py              # System prompts for all agents
│   └── database.py            # PostgreSQL connection string formatter
│
├── templates/
│   └── index.html             # BlogSmith Editorial Studio interface
│
├── static/
│   ├── css/
│   │   └── style.css          # Bespoke design system (Newsreader + JetBrains Mono)
│   └── js/
│       └── app.js             # Client SSE stream consumer & reactive DOM engine
│
├── images/                    # Generated technical diagrams
└── outputs/                   # Persisted run artifacts and final Markdown files
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Python 3.10+**
* **Groq API Key**: For ultra-fast inference ([Groq Console](https://console.groq.com))
* **Tavily API Key**: For live web research ([Tavily Search](https://tavily.com))
* **PostgreSQL Database** *(Optional)*: Free instance on [Render](https://render.com) or local PostgreSQL. (Falls back to `MemorySaver` if omitted).
* **Google Gemini API Key** *(Optional)*: For automated technical diagram generation.

### 2. Installation

Clone the repository and set up a Python virtual environment:

```powershell
# Clone the repository
git clone https://github.com/Sujalproject/BlogSmith.git
cd BlogSmith

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### 3. Environment Configuration

Create a `.env` file in the root directory:

```ini
# Groq LLM API Key (Required)
GROQ_API_KEY="gsk_..."

# Tavily Web Research API Key (Required for online mode)
TAVILY_API_KEY="tvly-..."

# Google Gemini API Key (Optional: for inline technical visual generation)
GOOGLE_API_KEY="AIzaSy..."

# PostgreSQL Database URL (Optional: for persistent thread checkpoints)
# Example (Render PostgreSQL External URL):
DATABASE_URL="postgresql://user:password@host.render.com/dbname?sslmode=require"

# Optional LangSmith Tracing
LANGSMITH_TRACING="true"
LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
LANGSMITH_API_KEY=""
LANGSMITH_PROJECT="BlogSmith"
```

---

### 4. Running the Application

Start the FastAPI application with Uvicorn:

```powershell
uvicorn app:app --reload --port 8000
```

Once running, navigate to:
👉 **`http://localhost:8000`**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Serves the BlogSmith Editorial Studio interface |
| `GET` | `/api/health` | Health check endpoint returning status of workflow graph |
| `POST` | `/api/run` | Triggers monograph synthesis; streams real-time SSE updates |
| `GET` | `/api/runs/{run_id}/download` | Downloads the generated `.md` file for a specific run ID |
| `GET` | `/images/{filename}` | Serves static visual diagrams generated by Gemini |

---

## 🛡️ Error Handling & Resiliency

* **Groq Rate-Limit Prevention**: Tavily results are pre-filtered and capped to 3 queries × 3 results, with snippet lengths restricted to 350 characters to stay within free-tier TPM allowances.
* **Max Token Truncation Protection**: LLMs are initialized with `max_tokens=4096` to prevent JSON tool calls from truncating mid-stream during large 6-section outline planning.
* **Connection Pooling**: PostgreSQL connections use `ConnectionPool` with automatic reconnection, preventing idle disconnects common with cloud-hosted databases.
* **Graceful Visual Fallback**: If diagram generation fails or `GOOGLE_API_KEY` is omitted, the reducer automatically places fallback callout blocks, ensuring the article remains fully readable and complete.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
