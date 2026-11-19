/**
 * BlogSmith // Autonomous Technical Blog Publisher - Client Application
 * Handles real-time LangGraph SSE streaming, DAG visual progression,
 * and high-fidelity editorial rendering.
 */

(function () {
    'use strict';

    // Application State
    const state = {
        isRunning: false,
        activeRunId: null,
        currentMarkdown: '',
        downloadUrl: null,
        plan: null,
        evidence: [],
        images: [],
        completedTaskIds: new Set(),
        totalTasks: 0,
        activeView: 'rendered', // 'rendered' | 'markdown'
        activeTab: 'tabOutline',
    };

    // DOM Element References
    const elements = {
        // Form & Input
        topicInput: document.getElementById('topicInput'),
        charCount: document.getElementById('charCount'),
        submitBtn: document.getElementById('submitBtn'),
        resetBtn: document.getElementById('resetBtn'),
        inspirationChips: document.querySelectorAll('.chip'),
        
        // System Status
        systemStatus: document.getElementById('systemStatus'),
        statusLabel: document.getElementById('statusLabel'),

        // Run Metadata
        runMetaCard: document.getElementById('runMetaCard'),
        metaRunId: document.getElementById('metaRunId'),
        metaMode: document.getElementById('metaMode'),
        metaSectionCount: document.getElementById('metaSectionCount'),

        // Pipeline DAG Stepper
        pipelineStatusBadge: document.getElementById('pipelineStatusBadge'),
        stepNodes: {
            router: document.getElementById('step-router'),
            research: document.getElementById('step-research'),
            orchestrator: document.getElementById('step-orchestrator'),
            workers: document.getElementById('step-workers'),
            reducer: document.getElementById('step-reducer'),
        },
        nodeBadges: {
            router: document.getElementById('badge-router'),
            research: document.getElementById('badge-research'),
            orchestrator: document.getElementById('badge-orchestrator'),
            workers: document.getElementById('badge-workers'),
            reducer: document.getElementById('badge-reducer'),
        },
        nodeDescs: {
            router: document.getElementById('desc-router'),
            research: document.getElementById('desc-research'),
            orchestrator: document.getElementById('desc-orchestrator'),
            workers: document.getElementById('desc-workers'),
            reducer: document.getElementById('desc-reducer'),
        },
        detailsRouter: document.getElementById('details-router'),
        detailsResearch: document.getElementById('details-research'),
        detailsOrchestrator: document.getElementById('details-orchestrator'),
        workersMatrix: document.getElementById('workersMatrix'),
        substageList: document.getElementById('substageList'),

        // Inspector Tabs
        tabButtons: document.querySelectorAll('.tab-btn'),
        tabContents: {
            tabOutline: document.getElementById('tabOutline'),
            tabSources: document.getElementById('tabSources'),
            tabVisuals: document.getElementById('tabVisuals'),
        },
        outlineCount: document.getElementById('outlineCount'),
        sourcesCount: document.getElementById('sourcesCount'),
        visualsCount: document.getElementById('visualsCount'),
        outlineList: document.getElementById('outlineList'),
        sourcesList: document.getElementById('sourcesList'),
        visualsGrid: document.getElementById('visualsGrid'),
        emptyOutline: document.getElementById('emptyOutline'),
        emptySources: document.getElementById('emptySources'),
        emptyVisuals: document.getElementById('emptyVisuals'),

        // Canvas
        canvasPlaceholder: document.getElementById('canvasPlaceholder'),
        streamingBanner: document.getElementById('streamingBanner'),
        bannerTitle: document.getElementById('bannerTitle'),
        bannerDetail: document.getElementById('bannerDetail'),
        bannerProgressBar: document.getElementById('bannerProgressBar'),
        renderedArticle: document.getElementById('renderedArticle'),
        rawMarkdownView: document.getElementById('rawMarkdownView'),
        rawMarkdownTextarea: document.getElementById('rawMarkdownTextarea'),

        // Toolbar Stats & Actions
        statWords: document.getElementById('statWords'),
        statReadTime: document.getElementById('statReadTime'),
        statSections: document.getElementById('statSections'),
        viewButtons: document.querySelectorAll('.view-btn'),
        copyMarkdownBtn: document.getElementById('copyMarkdownBtn'),
        downloadMarkdownBtn: document.getElementById('downloadMarkdownBtn'),

        // Lightbox & Toasts
        lightboxModal: document.getElementById('lightboxModal'),
        lightboxImg: document.getElementById('lightboxImg'),
        lightboxCaption: document.getElementById('lightboxCaption'),
        lightboxClose: document.getElementById('lightboxClose'),
        lightboxBackdrop: document.getElementById('lightboxBackdrop'),
        toastContainer: document.getElementById('toastContainer'),
    };

    // Initialize application
    function init() {
        initIcons();
        checkBackendHealth();
        setInterval(checkBackendHealth, 12000);
        bindEvents();
        configureMarked();
    }

    function initIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function configureMarked() {
        if (window.marked) {
            marked.setOptions({
                gfm: true,
                breaks: true,
                highlight: function (code, lang) {
                    if (window.hljs) {
                        const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
                        return hljs.highlight(code, { language: validLang }).value;
                    }
                    return code;
                }
            });
        }
    }

    // Ping /api/health to confirm graph status
    async function checkBackendHealth() {
        try {
            const res = await fetch('/api/health');
            if (res.ok) {
                const data = await res.json();
                elements.systemStatus.className = 'system-status online';
                elements.statusLabel.textContent = 'Graph Connected';
            } else {
                throw new Error('Unhealthy status code');
            }
        } catch (err) {
            elements.systemStatus.className = 'system-status error';
            elements.statusLabel.textContent = 'Backend Offline';
        }
    }

    // Event Bindings
    function bindEvents() {
        // Textarea input
        elements.topicInput.addEventListener('input', () => {
            const len = elements.topicInput.value.length;
            elements.charCount.textContent = `${len} character${len === 1 ? '' : 's'}`;
        });

        // Inspiration Chips
        elements.inspirationChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const topic = chip.dataset.topic;
                if (topic) {
                    elements.topicInput.value = topic;
                    elements.topicInput.dispatchEvent(new Event('input'));
                    elements.topicInput.focus();
                }
            });
        });

        // Keyboard Shortcut: Ctrl + Enter / Cmd + Enter
        elements.topicInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                startExecution();
            }
        });

        // Submit Button
        elements.submitBtn.addEventListener('click', startExecution);

        // Reset Button
        elements.resetBtn.addEventListener('click', resetStudioState);

        // View Mode Switcher (Article vs Markdown)
        elements.viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                setViewMode(view);
            });
        });

        // Inspector Tabs
        elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                switchTab(tab);
            });
        });

        // Copy Markdown Action
        elements.copyMarkdownBtn.addEventListener('click', copyMarkdownToClipboard);

        // Lightbox dismissal
        elements.lightboxClose.addEventListener('click', closeLightbox);
        elements.lightboxBackdrop.addEventListener('click', closeLightbox);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.lightboxModal.style.display !== 'none') {
                closeLightbox();
            }
        });
    }

    function setViewMode(view) {
        state.activeView = view;
        elements.viewButtons.forEach(b => {
            b.classList.toggle('active', b.dataset.view === view);
        });

        if (view === 'rendered') {
            elements.renderedArticle.style.display = 'block';
            elements.rawMarkdownView.style.display = 'none';
        } else {
            elements.renderedArticle.style.display = 'none';
            elements.rawMarkdownView.style.display = 'flex';
        }
    }

    function switchTab(tabId) {
        state.activeTab = tabId;
        elements.tabButtons.forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tabId);
        });
        Object.keys(elements.tabContents).forEach(key => {
            elements.tabContents[key].style.display = (key === tabId) ? 'block' : 'none';
        });
    }

    // Reset Studio State
    function resetStudioState() {
        if (state.isRunning) return;

        state.activeRunId = null;
        state.currentMarkdown = '';
        state.downloadUrl = null;
        state.plan = null;
        state.evidence = [];
        state.images = [];
        state.completedTaskIds.clear();
        state.totalTasks = 0;

        elements.runMetaCard.style.display = 'none';
        elements.metaRunId.textContent = '—';
        elements.metaMode.textContent = 'Awaiting Router';
        elements.metaSectionCount.textContent = '0';

        // Reset pipeline stepper
        elements.pipelineStatusBadge.textContent = 'Idle';
        elements.pipelineStatusBadge.className = 'pipeline-status-badge';

        Object.keys(elements.stepNodes).forEach(stage => {
            const node = elements.stepNodes[stage];
            node.className = 'step-node';
            elements.nodeBadges[stage].textContent = 'Pending';
        });

        elements.detailsRouter.style.display = 'none';
        elements.detailsRouter.innerHTML = '';
        elements.detailsResearch.style.display = 'none';
        elements.detailsResearch.innerHTML = '';
        elements.detailsOrchestrator.style.display = 'none';
        elements.detailsOrchestrator.innerHTML = '';
        elements.workersMatrix.innerHTML = '';
        elements.substageList.innerHTML = '';

        // Reset tabs
        elements.outlineList.innerHTML = '';
        elements.sourcesList.innerHTML = '';
        elements.visualsGrid.innerHTML = '';
        elements.emptyOutline.style.display = 'block';
        elements.emptySources.style.display = 'block';
        elements.emptyVisuals.style.display = 'block';
        elements.outlineCount.textContent = '0';
        elements.sourcesCount.textContent = '0';
        elements.visualsCount.textContent = '0';

        // Reset canvas
        elements.canvasPlaceholder.style.display = 'block';
        elements.streamingBanner.style.display = 'none';
        elements.renderedArticle.style.display = 'none';
        elements.renderedArticle.innerHTML = '';
        elements.rawMarkdownView.style.display = 'none';
        elements.rawMarkdownTextarea.value = '';

        // Reset stats
        elements.statWords.textContent = '0 words';
        elements.statReadTime.textContent = '0 min read';
        elements.statSections.textContent = '0/0 sections';

        elements.copyMarkdownBtn.disabled = true;
        elements.downloadMarkdownBtn.style.pointerEvents = 'none';
        elements.downloadMarkdownBtn.style.opacity = '0.5';
        elements.downloadMarkdownBtn.removeAttribute('href');
        elements.resetBtn.style.display = 'none';
    }

    // Start LangGraph Execution
    async function startExecution() {
        const topic = elements.topicInput.value.trim();
        if (topic.length < 3) {
            showToast('Please enter a technical topic (at least 3 characters).', 'error');
            elements.topicInput.focus();
            return;
        }

        if (state.isRunning) return;

        // UI Transition to Running State
        state.isRunning = true;
        elements.submitBtn.disabled = true;
        elements.submitBtn.innerHTML = `
            <span class="btn-spinner"></span>
            <span class="btn-text">Synthesizing...</span>
        `;
        elements.resetBtn.style.display = 'none';
        elements.systemStatus.className = 'system-status busy';
        elements.statusLabel.textContent = 'Graph Active';

        resetStudioState();
        elements.canvasPlaceholder.style.display = 'none';
        elements.streamingBanner.style.display = 'flex';
        elements.bannerTitle.textContent = 'Synthesizing Blog...';
        elements.bannerDetail.textContent = 'Initializing LangGraph execution thread';
        elements.bannerProgressBar.style.width = '6%';

        if (state.activeView === 'rendered') {
            elements.renderedArticle.style.display = 'block';
        } else {
            elements.rawMarkdownView.style.display = 'flex';
        }

        elements.pipelineStatusBadge.textContent = 'Running';
        elements.pipelineStatusBadge.className = 'pipeline-status-badge running';

        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Server error (${response.status})`);
            }

            await consumeEventStream(response.body);

        } catch (error) {
            console.error('Workflow error:', error);
            showToast(error.message || 'Workflow execution failed.', 'error');
            elements.pipelineStatusBadge.textContent = 'Error';
            elements.pipelineStatusBadge.className = 'pipeline-status-badge';
            elements.bannerTitle.textContent = 'Execution Failed';
            elements.bannerDetail.textContent = error.message;
        } finally {
            state.isRunning = false;
            elements.submitBtn.disabled = false;
            elements.submitBtn.innerHTML = `
                <i data-lucide="play" class="btn-icon"></i>
                <span class="btn-text">Generate Blog</span>
            `;
            elements.resetBtn.style.display = 'inline-flex';
            elements.systemStatus.className = 'system-status online';
            elements.statusLabel.textContent = 'Graph Connected';
            initIcons();
        }
    }

    // SSE Reader using ReadableStream and TextDecoder
    async function consumeEventStream(readableStream) {
        const reader = readableStream.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split('\n\n');
            buffer = chunks.pop() || ''; // Keep trailing remainder

            for (const chunk of chunks) {
                const trimmed = chunk.trim();
                if (!trimmed) continue;

                // Match `data: {...}`
                const lines = trimmed.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const jsonStr = line.slice(5).trim();
                        if (jsonStr) {
                            try {
                                const payload = JSON.parse(jsonStr);
                                handleServerEvent(payload);
                            } catch (e) {
                                console.warn('Could not parse SSE payload:', jsonStr);
                            }
                        }
                    }
                }
            }
        }
    }

    // Server-Sent Event Dispatcher
    function handleServerEvent(data) {
        if (!data || !data.type) return;

        switch (data.type) {
            case 'run_started':
                state.activeRunId = data.run_id;
                elements.runMetaCard.style.display = 'block';
                elements.metaRunId.textContent = data.run_id ? data.run_id.slice(0, 8) : 'active';
                elements.bannerDetail.textContent = `Active Thread ID: ${data.run_id}`;
                break;

            case 'stage':
                handleStageEvent(data);
                break;

            case 'routing':
                handleRoutingEvent(data);
                break;

            case 'research_complete':
                handleResearchCompleteEvent(data);
                break;

            case 'plan':
                handlePlanEvent(data);
                break;

            case 'section_complete':
                handleSectionCompleteEvent(data);
                break;

            case 'substage':
                handleSubstageEvent(data);
                break;

            case 'images_planned':
                handleImagesPlannedEvent(data);
                break;

            case 'final':
                handleFinalEvent(data);
                break;

            case 'done':
                handleDoneEvent(data);
                break;

            case 'error':
                handleErrorEvent(data);
                break;

            default:
                break;
        }
    }

    // Stage updates (Router, Research, Orchestrator, Workers, Reducer)
    function handleStageEvent(data) {
        const stageId = data.id;
        const node = elements.stepNodes[stageId];
        const badge = elements.nodeBadges[stageId];
        const desc = elements.nodeDescs[stageId];

        if (node && badge) {
            if (data.status === 'running') {
                node.className = 'step-node running';
                badge.textContent = 'Running';
                if (data.detail && desc) desc.textContent = data.detail;
                elements.bannerTitle.textContent = data.label || 'Processing...';
                if (data.detail) elements.bannerDetail.textContent = data.detail;
            } else if (data.status === 'completed') {
                node.className = 'step-node completed';
                badge.textContent = 'Complete';
                if (data.detail && desc) desc.textContent = data.detail;
            } else if (data.status === 'skipped') {
                node.className = 'step-node skipped';
                badge.textContent = 'Skipped';
                if (data.detail && desc) desc.textContent = data.detail;
            }
        }

        // Stepper Progress Bar mapping
        const stageProgress = {
            router: 15,
            research: 30,
            orchestrator: 45,
            workers: 70,
            reducer: 90,
        };
        if (stageProgress[stageId]) {
            elements.bannerProgressBar.style.width = `${stageProgress[stageId]}%`;
        }
    }

    // Routing decision
    function handleRoutingEvent(data) {
        const mode = data.mode ? data.mode.replace('_', ' ') : 'Standard';
        elements.metaMode.textContent = mode.toUpperCase();
        
        let html = `<strong>Mode:</strong> ${data.mode} | <strong>Web Research:</strong> ${data.needs_research ? 'Yes' : 'No'}`;
        if (data.queries && data.queries.length > 0) {
            html += `<br><strong>Queries (${data.queries.length}):</strong><ul style="padding-left:14px; margin-top:4px;">`;
            data.queries.slice(0, 3).forEach(q => {
                html += `<li>"${escapeHtml(q)}"</li>`;
            });
            html += `</ul>`;
        }
        elements.detailsRouter.innerHTML = html;
        elements.detailsRouter.style.display = 'block';
    }

    // Research complete with evidence pack
    function handleResearchCompleteEvent(data) {
        const evidence = data.evidence || [];
        state.evidence = evidence;
        elements.sourcesCount.textContent = data.count || evidence.length;

        if (evidence.length > 0) {
            elements.emptySources.style.display = 'none';
            elements.sourcesList.innerHTML = evidence.map((e, idx) => `
                <div class="source-item">
                    <a href="${escapeHtml(e.url)}" target="_blank" rel="noopener" class="source-title" title="${escapeHtml(e.title || e.url)}">
                        ${idx + 1}. ${escapeHtml(e.title || 'Untitled Reference')}
                    </a>
                    ${e.snippet ? `<p class="source-snippet">${escapeHtml(e.snippet.slice(0, 160))}...</p>` : ''}
                    <div class="source-url">${escapeHtml(e.url)}</div>
                </div>
            `).join('');
        }
    }

    // Plan complete from Orchestrator
    function handlePlanEvent(data) {
        const plan = data.plan || {};
        state.plan = plan;
        const tasks = plan.tasks || [];
        state.totalTasks = tasks.length;
        elements.metaSectionCount.textContent = tasks.length;
        elements.outlineCount.textContent = tasks.length;

        // Render Outline in Tab
        if (tasks.length > 0) {
            elements.emptyOutline.style.display = 'none';
            elements.outlineList.innerHTML = tasks.map(t => `
                <div class="outline-item">
                    <div class="outline-item-title">${t.id}. ${escapeHtml(t.title)}</div>
                    <div class="outline-item-goal">${escapeHtml(t.goal || '')}</div>
                    ${t.bullets && t.bullets.length ? `
                        <ul class="outline-item-bullets">
                            ${t.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('');

            // Render Parallel Workers Matrix
            elements.workersMatrix.innerHTML = tasks.map(t => `
                <div class="worker-card" id="worker-card-${t.id}">
                    <div class="worker-card-header">
                        <span class="worker-id">Worker #${t.id}</span>
                        <span class="worker-status-icon" id="worker-status-${t.id}">⏳</span>
                    </div>
                    <div class="worker-title" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</div>
                    <div class="worker-meta">${t.target_words || 250} words target</div>
                </div>
            `).join('');
        }
    }

    // Parallel worker finished a section
    function handleSectionCompleteEvent(data) {
        const taskId = data.task_id;
        state.completedTaskIds.add(taskId);

        // Update Worker Tile
        const card = document.getElementById(`worker-card-${taskId}`);
        const statusIcon = document.getElementById(`worker-status-${taskId}`);
        if (card) {
            card.className = 'worker-card completed';
        }
        if (statusIcon) {
            statusIcon.textContent = '✓';
        }

        // Update stats
        const completed = data.completed || state.completedTaskIds.size;
        const total = data.total || state.totalTasks;
        elements.statSections.textContent = `${completed}/${total} sections`;

        // Intermediate preview injection
        if (!state.currentMarkdown && data.markdown) {
            appendSectionDraft(data.title, data.markdown);
        }
    }

    function appendSectionDraft(title, sectionMd) {
        const wrapper = document.createElement('div');
        wrapper.className = 'intermediate-section';
        wrapper.innerHTML = window.marked ? marked.parse(sectionMd) : sectionMd;
        elements.renderedArticle.appendChild(wrapper);
        updateDocMetrics(elements.renderedArticle.innerText);
    }

    // Substage under Reducer
    function handleSubstageEvent(data) {
        const item = document.createElement('div');
        item.className = 'substage-item';
        item.innerHTML = `<span>✓</span><span>${escapeHtml(data.label)}</span>`;
        elements.substageList.appendChild(item);
    }

    // Images planned
    function handleImagesPlannedEvent(data) {
        const images = data.images || [];
        state.images = images;
        elements.visualsCount.textContent = data.count || images.length;

        if (images.length > 0) {
            elements.emptyVisuals.style.display = 'none';
            elements.visualsGrid.innerHTML = images.map(img => `
                <div class="visual-item">
                    <div class="visual-caption">${escapeHtml(img.caption || img.alt || 'Technical Visual')}</div>
                    <div class="visual-prompt"><strong>Prompt:</strong> ${escapeHtml(img.prompt)}</div>
                </div>
            `).join('');
        }
    }

    // Final article synthesized
    function handleFinalEvent(data) {
        const markdown = data.markdown || '';
        state.currentMarkdown = markdown;
        state.downloadUrl = data.download_url;

        // Render Markdown into Article Canvas
        if (window.marked && window.DOMPurify) {
            const rawHtml = marked.parse(markdown);
            const cleanHtml = DOMPurify.sanitize(rawHtml, {
                ADD_TAGS: ['img'],
                ADD_ATTR: ['src', 'alt', 'title', 'loading']
            });
            elements.renderedArticle.innerHTML = cleanHtml;
        } else {
            elements.renderedArticle.innerText = markdown;
        }

        // Set Raw Markdown textarea
        elements.rawMarkdownTextarea.value = markdown;

        // Enable Actions
        elements.copyMarkdownBtn.disabled = false;
        if (data.download_url) {
            elements.downloadMarkdownBtn.href = data.download_url;
            elements.downloadMarkdownBtn.style.pointerEvents = 'auto';
            elements.downloadMarkdownBtn.style.opacity = '1';
        }

        // Update stats
        updateDocMetrics(markdown);

        // Bind image zoom / lightbox on all rendered images
        setupImageLightbox();

        // Highlight all code blocks
        if (window.hljs) {
            elements.renderedArticle.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }
    }

    // Workflow fully finished
    function handleDoneEvent(data) {
        elements.bannerProgressBar.style.width = '100%';
        elements.pipelineStatusBadge.textContent = 'Completed';
        elements.pipelineStatusBadge.className = 'pipeline-status-badge completed';
        elements.bannerTitle.textContent = 'Publication Ready';
        elements.bannerDetail.textContent = 'The blog has been assembled and verified.';
        showToast('Blog successfully synthesized!', 'success');
    }

    // Error event
    function handleErrorEvent(data) {
        showToast(data.message || 'Error occurred during workflow.', 'error');
        elements.pipelineStatusBadge.textContent = 'Error';
        elements.pipelineStatusBadge.className = 'pipeline-status-badge';
        elements.bannerTitle.textContent = 'Execution Error';
        elements.bannerDetail.textContent = data.message;
    }

    // Calculate word count and estimated reading time
    function updateDocMetrics(text) {
        if (!text) return;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        elements.statWords.textContent = `${words.toLocaleString()} words`;
        const readTime = Math.max(1, Math.ceil(words / 220));
        elements.statReadTime.textContent = `${readTime} min read`;
    }

    // Lightbox modal for rendered diagrams
    function setupImageLightbox() {
        const imgs = elements.renderedArticle.querySelectorAll('img');
        imgs.forEach(img => {
            img.addEventListener('click', () => {
                elements.lightboxImg.src = img.src;
                elements.lightboxCaption.textContent = img.alt || img.nextElementSibling?.textContent || 'Technical Visual';
                elements.lightboxModal.style.display = 'flex';
            });
        });
    }

    function closeLightbox() {
        elements.lightboxModal.style.display = 'none';
        elements.lightboxImg.src = '';
    }

    // Clipboard Copy
    async function copyMarkdownToClipboard() {
        if (!state.currentMarkdown) return;
        try {
            await navigator.clipboard.writeText(state.currentMarkdown);
            showToast('Markdown copied to clipboard!', 'success');
        } catch (e) {
            elements.rawMarkdownTextarea.select();
            document.execCommand('copy');
            showToast('Markdown copied!', 'success');
        }
    }

    // Toast notification
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span><span>${escapeHtml(message)}</span>`;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            toast.style.transition = 'all 200ms ease';
            setTimeout(() => toast.remove(), 220);
        }, 4000);
    }

    // HTML escape helper
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Boot on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
