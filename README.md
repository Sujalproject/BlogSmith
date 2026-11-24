<div align="center">

# ✦ BlogSmith

### From a topic to a publication-ready technical article — through a coordinated team of AI agents.

**An autonomous multi-agent technical blog publisher built with LangGraph, Groq, Google Gemini, Tavily, and FastAPI.**

<br/>

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.2-1C3C3C?style=for-the-badge)](https://github.com/langchain-ai/langgraph)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Groq](https://img.shields.io/badge/Groq-Inference-F55036?style=for-the-badge)](https://groq.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br/>

**Research · Plan · Write in Parallel · Assemble · Illustrate · Publish**

</div>

---

## ✨ What is BlogSmith?

BlogSmith is an **AI-powered, multi-agent publishing system** that transforms a technical topic into a structured, research-backed, long-form article.

Instead of asking one LLM to write an entire article in a single prompt, BlogSmith coordinates specialized agents through a **LangGraph workflow**. The system can research a topic, create an editorial plan, delegate sections to parallel workers, and assemble the results into a polished Markdown article with generated technical visuals.

The result is a more structured writing workflow with observable execution, evidence inspection, and an interactive editorial workspace.

> **The idea:** treat technical writing like an editorial production pipeline — not a single prompt.

---

## 🧭 How It Works

The workflow is designed around a **Map-Reduce architecture**. Each stage has a focused responsibility, while independent article sections can be generated concurrently.

\`\`\`mermaid
flowchart TD
    A([Topic / User Request]) --> B[1. Intelligent Router]
    B -->|Open-book / Hybrid| C[2. Research Agent]
    B -->|Closed-book| D[3. Editorial Orchestrator]
    C --> D
    D --> E{Section Tasks}
    E --> F[Worker 1]
    E --> G[Worker 2]
    E --> H[Worker N]
    F --> I[4. Reducer Subgraph]
    G --> I
    H --> I
    I --> J[Merge Sections]
    J --> K[Plan Technical Visuals]
    K --> L[Gemini Image Generation]
    L --> M([Final Markdown Article])
\`\`\`

### Workflow at a glance

| Stage | Agent / Component | Responsibility |
|:--|:--|:--|
| 01 | **Intelligent Router** | Selects \`closed_book\`, \`open_book\`, or \`hybrid\` mode based on topic complexity |
| 02 | **Research Agent** | Uses Tavily to gather relevant web evidence, deduplicate URLs, and build an evidence pack |
| 03 | **Editorial Orchestrator** | Creates the article outline, audience parameters, constraints, word targets, and section tasks |
| 04 | **Parallel Workers** | Uses LangGraph's \`Send\` API to draft independent sections concurrently |
| 05 | **Reducer Subgraph** | Merges sections in order and plans where technical visuals belong |
| 06 | **Visual Generation** | Uses Google Gemini to generate technical visual assets and place them in the article |

---

## 🚀 Features

<table>
<tr>
<td width="50%" valign="top">

### 🧠 Multi-Agent Orchestration
A LangGraph workflow with specialized router, research, orchestration, worker, and reducer components.

</td>
<td width="50%" valign="top">

### ⚡ Parallel Section Writing
Dynamic fan-out with LangGraph's \`Send\` API lets independent sections be drafted concurrently.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🔎 Research-Backed Writing
Tavily-powered research gathers relevant sources and builds a deduplicated evidence pack for the writing workflow.

</td>
<td width="50%" valign="top">

### 🖼️ Technical Visual Generation
The reducer plans visual placements and uses Gemini to generate supporting technical diagrams.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📡 Live Workflow Streaming
FastAPI Server-Sent Events stream execution updates to the frontend as the workflow progresses.

</td>
<td width="50%" valign="top">

### 💾 Persistent Checkpointing
PostgreSQL \`PostgresSaver\` with \`psycopg_pool\` supports persistent graph checkpoints, with \`MemorySaver\` as an offline fallback.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🧪 Evidence & Execution Inspector
Inspect the structured outline, collected evidence, diagram specifications, and live worker progress.

</td>
<td width="50%" valign="top">

### ✍️ Editorial Studio
Review the rendered article or raw Markdown, copy the content, and download the generated \`.md\` file.

</td>
</tr>
</table>

### Editorial Studio

The frontend is a custom-built, dark-mode workspace using HTML, CSS, and vanilla JavaScript.

- **Live DAG stepper** with execution states.
- **Parallel worker matrix** to monitor section progress.
- **Tabbed inspector** for outline, evidence links and snippets, and visual diagram specifications.
- **Dual article view** with rendered content and raw Markdown.
- **Syntax-highlighted code** and zoomable diagram lightbox.
- **One-click copy** and Markdown file download.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|:--|:--|
| Agent orchestration | LangGraph, LangChain |
| LLM inference | Groq |
| Visual generation | Google Gemini |
| Web research | Tavily |
| Backend | Python, FastAPI, Uvicorn |
| Streaming | Server-Sent Events (SSE), Fetch API, ReadableStream |
| Persistence | PostgreSQL, LangGraph PostgresSaver, psycopg_pool |
| Validation / schemas | Pydantic |
| Frontend | HTML, CSS, Vanilla JavaScript |

---

## 🗂️ Project Structure

\`\`\`text
BlogSmith/
│
├── app.py                     # FastAPI app, endpoints & SSE streaming
├── requirements.txt           # Python dependencies
├── pyproject.toml              # Project configuration
├── .env                        # Local environment variables (not committed)
├── .gitignore                  # Excludes secrets and local artifacts
│
├── backend/
│   ├── __init__.py
│   ├── graph.py                # LangGraph workflow & connection pooling
│   ├── nodes.py                # Router, research, orchestrator, workers, reducer
│   ├── model.py                # Groq model initialization
│   ├── schema.py               # Pydantic state and workflow schemas
│   ├── prompt.py               # Agent prompts
│   └── database.py             # PostgreSQL connection configuration
│
├── templates/
│   └── index.html              # Editorial Studio interface
│
├── static/
│   ├── css/
│   │   └── style.css           # Custom design system
│   └── js/
│       └── app.js              # SSE client & reactive UI
│
├── images/                     # Generated technical diagrams
└── outputs/                    # Generated run artifacts and Markdown
\`\`\`

---

## ⚙️ Getting Started

### Prerequisites

Before running BlogSmith, make sure you have:

- **Python 3.10 or newer**
- A **Groq API key** — required for LLM inference
- A **Tavily API key** — required for online research mode
- A **Google Gemini API key** — optional, for generated technical visuals
- **PostgreSQL** — optional, for persistent graph checkpoints

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/Sujalproject/BlogSmith.git
cd BlogSmith
\`\`\`

### 2. Create and activate a virtual environment

**Windows — PowerShell**

\`\`\`powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
\`\`\`

**Windows — Command Prompt**

\`\`\`bat
python -m venv .venv
.venv\\Scripts\\activate.bat
\`\`\`

**Linux / macOS**

\`\`\`bash
python3 -m venv .venv
source .venv/bin/activate
\`\`\`

### 3. Install dependencies

\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 4. Configure environment variables

Create a \`.env\` file in the project root:

\`\`\`ini
# Required: LLM inference
GROQ_API_KEY=your_groq_api_key

# Required for online research mode
TAVILY_API_KEY=your_tavily_api_key

# Optional: technical visual generation
GOOGLE_API_KEY=your_google_gemini_api_key

# Optional: persistent LangGraph checkpoints
DATABASE_URL=postgresql://user:password@host:5432/database_name

# Optional: LangSmith observability
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=BlogSmith
\`\`\`

**Keep your API keys private.** Never commit your \`.env\` file or expose credentials in screenshots, logs, or public issues.

### 5. Run BlogSmith

\`\`\`bash
uvicorn app:app --reload --port 8000
\`\`\`

Open the Editorial Studio:

**http://localhost:8000**

---

## 🔌 API Reference

| Method | Endpoint | Description |
|:--|:--|:--|
| \`GET\` | \`/\` | Serves the BlogSmith Editorial Studio |
| \`GET\` | \`/api/health\` | Returns workflow graph health status |
| \`POST\` | \`/api/run\` | Starts article generation and streams workflow updates over SSE |
| \`GET\` | \`/api/runs/{run_id}/download\` | Downloads the generated Markdown file for a run |
| \`GET\` | \`/images/{filename}\` | Serves generated technical visual assets |

---

## 🧩 Engineering Highlights

A few implementation decisions that shape BlogSmith:

- **Map-Reduce generation:** the orchestrator breaks an article into discrete section tasks, and parallel workers handle those tasks independently.
- **Dynamic graph fan-out:** LangGraph's \`Send\` API is used to dispatch section workers based on the generated plan.
- **Research context management:** URLs are deduplicated and research snippets are compressed before structured extraction. The project targets a substantial reduction in research-context token usage.
- **Checkpoint resilience:** PostgreSQL-backed checkpointing is used when configured; the workflow can fall back to in-memory checkpointing when the database is unavailable.
- **Observable execution:** SSE events connect backend workflow progress to the live Editorial Studio interface.

---

## 🛣️ Future Improvements

Potential areas to extend the project:

- Add automated quality evaluation for factuality, source coverage, and article structure.
- Add richer export options and publishing integrations.
- Improve retry and recovery behavior for individual workflow stages.
- Add automated tests for graph nodes, API routes, and end-to-end article generation.

---

## 🤝 Contributing

Suggestions, bug reports, and contributions are welcome.

1. Fork the repository.
2. Create a feature branch: \`git checkout -b feature/your-feature\`.
3. Commit your changes: \`git commit -m "Add: your feature"\`.
4. Push your branch: \`git push origin feature/your-feature\`.
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

### ✦ Built to make technical publishing more structured, observable, and collaborative.

**If you find BlogSmith interesting, consider giving the repository a ⭐**

[**Explore BlogSmith on GitHub →**](https://github.com/Sujalproject/BlogSmith)

</div>
