/**
 * PyLearn - Main Application Logic
 * Integrates Monaco Editor, Pyodide, challenge system, and help panel
 */

// ============================================
// State Management
// ============================================
const state = {
    currentChallenge: 0,
    completedChallenges: new Set(),
    pyodide: null,
    editor: null,
    helpVisible: false,
    editorVisible: false,
    streak: 0,
    inputResolve: null,   // for handling Python input()
    inputBuffer: [],
};

// Load saved progress from localStorage
function loadProgress() {
    try {
        const saved = localStorage.getItem('pylearn_progress');
        if (saved) {
            const data = JSON.parse(saved);
            state.completedChallenges = new Set(data.completed || []);
            state.streak = data.streak || 0;
            state.currentChallenge = data.currentChallenge || 0;
        }
    } catch (e) {
        // ignore parse errors
    }
}

function saveProgress() {
    try {
        localStorage.setItem('pylearn_progress', JSON.stringify({
            completed: Array.from(state.completedChallenges),
            streak: state.streak,
            currentChallenge: state.currentChallenge,
        }));
    } catch (e) {
        // ignore storage errors
    }
}

// ============================================
// Initialization
// ============================================
async function init() {
    loadProgress();

    updateLoadingStatus('Loading Monaco Editor...', 20);
    await initMonaco();

    updateLoadingStatus('Loading Python runtime (Pyodide)...', 50);
    await initPyodide();

    updateLoadingStatus('Setting up challenges...', 85);
    setupUI();

    updateLoadingStatus('Ready!', 100);
    setTimeout(() => {
        document.getElementById('loading-overlay').classList.add('hidden');
    }, 400);

    // Load first challenge or last viewed
    loadChallenge(state.currentChallenge);
}

function updateLoadingStatus(message, percent) {
    document.getElementById('loading-status').textContent = message;
    document.getElementById('loader-fill').style.width = percent + '%';
}

// ============================================
// Monaco Editor Setup
// ============================================
function initMonaco() {
    return new Promise((resolve) => {
        require.config({
            paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }
        });

        require(['vs/editor/editor.main'], function () {
            // Define custom dark theme matching VSCode
            monaco.editor.defineTheme('pylearn-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'comment', foreground: '6A9955' },
                    { token: 'keyword', foreground: 'C586C0' },
                    { token: 'string', foreground: 'CE9178' },
                    { token: 'number', foreground: 'B5CEA8' },
                    { token: 'function', foreground: 'DCDCAA' },
                    { token: 'variable', foreground: '9CDCFE' },
                    { token: 'type', foreground: '4EC9B0' },
                ],
                colors: {
                    'editor.background': '#1e1e1e',
                    'editor.foreground': '#d4d4d4',
                    'editorLineNumber.foreground': '#858585',
                    'editorLineNumber.activeForeground': '#c6c6c6',
                    'editor.selectionBackground': '#264f78',
                    'editor.lineHighlightBackground': '#2a2d2e',
                    'editorCursor.foreground': '#aeafad',
                    'editorWhitespace.foreground': '#404040',
                }
            });

            state.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                value: '',
                language: 'python',
                theme: 'pylearn-dark',
                fontSize: 14,
                fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                minimap: { enabled: true, maxColumn: 80 },
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'off',
                padding: { top: 8 },
                bracketPairColorization: { enabled: true },
                smoothScrolling: true,
                cursorSmoothCaretAnimation: 'on',
                suggest: {
                    showKeywords: true,
                    showSnippets: true,
                },
            });

            // Track cursor position for status bar
            state.editor.onDidChangeCursorPosition((e) => {
                const pos = e.position;
                const statusLine = document.querySelector('.statusbar-right .status-item:nth-child(3)');
                if (statusLine) {
                    statusLine.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
                }
            });

            // Ctrl+Enter to run
            state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                runCode();
            });

            // Ctrl+S to save (prevent default)
            state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                // visual feedback
                const tab = document.querySelector('.editor-tab.active .tab-modified');
                if (tab) tab.style.display = 'none';
            });

            resolve();
        });
    });
}

// ============================================
// Pyodide Setup
// ============================================
async function initPyodide() {
    try {
        state.pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        });

        // Set up stdout/stderr capture
        state.pyodide.runPython(`
import sys
from io import StringIO
`);
    } catch (err) {
        appendTerminalLine('Failed to load Python runtime: ' + err.message, 'error');
    }
}

// ============================================
// Run Python Code
// ============================================
async function runCode() {
    const code = state.editor.getValue();
    if (!code.trim()) {
        appendTerminalLine('No code to run.', 'system');
        return;
    }

    clearTerminal();
    appendTerminalLine('$ python ' + CHALLENGES[state.currentChallenge].filename, 'system');
    appendTerminalLine('', 'system');

    const runBtn = document.getElementById('btn-run');
    runBtn.disabled = true;
    runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';

    try {
        // Check if code uses input() - we need to handle it
        const usesInput = /\binput\s*\(/.test(code);

        if (usesInput) {
            await runCodeWithInput(code);
        } else {
            await runCodeDirect(code);
        }
    } catch (err) {
        appendTerminalLine(err.message, 'error');
    }

    runBtn.disabled = false;
    runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run';
}

async function runCodeDirect(code) {
    try {
        state.pyodide.runPython(`
import sys
from io import StringIO
_stdout = StringIO()
_stderr = StringIO()
sys.stdout = _stdout
sys.stderr = _stderr
`);

        state.pyodide.runPython(code);

        const stdout = state.pyodide.runPython('_stdout.getvalue()');
        const stderr = state.pyodide.runPython('_stderr.getvalue()');

        // Reset stdout/stderr
        state.pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

        if (stdout) {
            stdout.split('\n').forEach((line, i, arr) => {
                if (i < arr.length - 1 || line) {
                    appendTerminalLine(line, 'output');
                }
            });
        }

        if (stderr) {
            stderr.split('\n').forEach(line => {
                if (line) appendTerminalLine(line, 'error');
            });
        }

        if (!stdout && !stderr) {
            appendTerminalLine('(Program finished with no output)', 'system');
        }

        appendTerminalLine('', 'system');
        appendTerminalLine('Process finished with exit code 0', 'success');

    } catch (err) {
        state.pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
        // Format Python errors nicely
        let errorMsg = err.message;
        // Extract just the relevant Python traceback
        const lines = errorMsg.split('\n');
        const pyLines = lines.filter(l =>
            l.includes('Error') || l.includes('line') || l.startsWith('  ')
        );
        if (pyLines.length > 0) {
            pyLines.forEach(l => appendTerminalLine(l, 'error'));
        } else {
            appendTerminalLine(errorMsg, 'error');
        }
        appendTerminalLine('', 'system');
        appendTerminalLine('Process finished with exit code 1', 'error');
    }
}

async function runCodeWithInput(code) {
    // Replace input() calls with a pre-seeded list approach
    // Show input line in terminal for user interaction
    const inputLine = document.getElementById('terminal-input-line');
    const inputField = document.getElementById('terminal-input');
    inputLine.classList.remove('hidden');

    // We'll collect input values first, then run
    const inputMatches = code.match(/input\s*\([^)]*\)/g) || [];
    const inputPrompts = inputMatches.map(m => {
        const match = m.match(/input\s*\(\s*['"](.*)['"]|input\s*\(\s*\)/);
        return match && match[1] ? match[1] : '';
    });

    let inputValues = [];
    for (let i = 0; i < inputPrompts.length; i++) {
        const prompt = inputPrompts[i];
        if (prompt) {
            appendTerminalLine(prompt, 'output');
        }
        const value = await getTerminalInput();
        appendTerminalLine(value, 'input-echo');
        inputValues.push(value);
    }

    inputLine.classList.add('hidden');

    // Now run with pre-set inputs
    const inputSetup = `
import sys
from io import StringIO
_inputs = ${JSON.stringify(inputValues)}
_input_idx = 0
_orig_input = input
def _mock_input(prompt=""):
    global _input_idx
    if _input_idx < len(_inputs):
        val = _inputs[_input_idx]
        _input_idx += 1
        return val
    return ""
input = _mock_input
_stdout = StringIO()
_stderr = StringIO()
sys.stdout = _stdout
sys.stderr = _stderr
`;

    try {
        state.pyodide.runPython(inputSetup);
        state.pyodide.runPython(code);

        const stdout = state.pyodide.runPython('_stdout.getvalue()');
        const stderr = state.pyodide.runPython('_stderr.getvalue()');

        state.pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
input = _orig_input
`);

        if (stdout) {
            stdout.split('\n').forEach((line, i, arr) => {
                if (i < arr.length - 1 || line) {
                    appendTerminalLine(line, 'output');
                }
            });
        }

        if (stderr) {
            stderr.split('\n').forEach(line => {
                if (line) appendTerminalLine(line, 'error');
            });
        }

        appendTerminalLine('', 'system');
        appendTerminalLine('Process finished with exit code 0', 'success');

    } catch (err) {
        state.pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
input = _orig_input
`);
        let errorMsg = err.message;
        const lines = errorMsg.split('\n');
        lines.forEach(l => {
            if (l.trim()) appendTerminalLine(l, 'error');
        });
        appendTerminalLine('', 'system');
        appendTerminalLine('Process finished with exit code 1', 'error');
    }
}

function getTerminalInput() {
    return new Promise((resolve) => {
        const inputField = document.getElementById('terminal-input');
        inputField.value = '';
        inputField.focus();
        state.inputResolve = resolve;
    });
}

// ============================================
// Terminal Management
// ============================================
function appendTerminalLine(text, type = 'output') {
    const terminal = document.getElementById('terminal-output');
    const line = document.createElement('div');
    line.className = 'terminal-line ' + type;

    if (type === 'system' && text.startsWith('$')) {
        line.innerHTML = `<span class="prompt-symbol">$</span>${escapeHtml(text.substring(1))}`;
    } else {
        line.textContent = text;
    }

    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function clearTerminal() {
    document.getElementById('terminal-output').innerHTML = '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Challenge System
// ============================================
function loadChallenge(index) {
    if (index < 0 || index >= CHALLENGES.length) return;

    state.currentChallenge = index;
    saveProgress();

    const challenge = CHALLENGES[index];

    // Update title bar
    document.getElementById('titlebar-filename').textContent =
        `${challenge.filename} - PyLearn`;

    // Update assignment panel
    document.getElementById('assignment-body').innerHTML = challenge.description;

    // Show assignment, hide editor
    showAssignment();

    // Update sidebar highlights
    updateFileTree();
    updateChallengeList();
    updateProgress();

    // Update status bar
    document.getElementById('status-challenge').innerHTML =
        `<i class="fa-solid fa-graduation-cap"></i> Challenge ${index + 1}/${CHALLENGES.length}`;

    // Update editor tab
    updateEditorTabs();

    // Set editor code
    if (state.editor) {
        state.editor.setValue(challenge.starterCode);
    }

    // Clear terminal
    clearTerminal();
    appendTerminalLine(`$ Ready for: ${challenge.title}`, 'system');
    appendTerminalLine('$ Click "Start Coding" to begin, or press Ctrl+Enter to run', 'system');
}

function showAssignment() {
    state.editorVisible = false;
    document.getElementById('assignment-panel').classList.add('assignment-visible');
    document.getElementById('editor-and-help').classList.remove('editor-visible');
    document.getElementById('editor-and-help').classList.add('editor-hidden');
}

function showEditor() {
    state.editorVisible = true;
    document.getElementById('assignment-panel').classList.remove('assignment-visible');
    document.getElementById('editor-and-help').classList.add('editor-visible');
    document.getElementById('editor-and-help').classList.remove('editor-hidden');
    if (state.editor) {
        state.editor.layout();
        state.editor.focus();
    }
}

function submitSolution() {
    const code = state.editor.getValue();
    if (!code.trim()) {
        appendTerminalLine('No code to submit.', 'system');
        return;
    }

    clearTerminal();
    appendTerminalLine('$ Validating solution...', 'system');
    appendTerminalLine('', 'system');

    const challenge = CHALLENGES[state.currentChallenge];

    try {
        // Run code and capture output
        state.pyodide.runPython(`
import sys
from io import StringIO
_stdout = StringIO()
_stderr = StringIO()
sys.stdout = _stdout
sys.stderr = _stderr
`);

        state.pyodide.runPython(code);

        const stdout = state.pyodide.runPython('_stdout.getvalue()');
        const stderr = state.pyodide.runPython('_stderr.getvalue()');

        state.pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

        // Show output
        if (stdout) {
            stdout.split('\n').forEach((line, i, arr) => {
                if (i < arr.length - 1 || line) {
                    appendTerminalLine(line, 'output');
                }
            });
        }

        if (stderr) {
            stderr.split('\n').forEach(line => {
                if (line) appendTerminalLine(line, 'error');
            });
            appendTerminalLine('', 'system');
            appendTerminalLine('Submission failed - your code has errors.', 'error');
            return;
        }

        appendTerminalLine('', 'system');

        // Validate output
        if (challenge.validate(stdout || '')) {
            appendTerminalLine('All tests passed!', 'success');
            appendTerminalLine('Challenge completed successfully!', 'success');

            state.completedChallenges.add(challenge.id);
            state.streak++;
            saveProgress();
            updateProgress();
            updateChallengeList();
            updateFileTree();

            showCompletionModal(challenge);
        } else {
            appendTerminalLine('Tests failed - output does not match expected.', 'error');
            appendTerminalLine('Check the challenge description for expected output.', 'system');
            appendTerminalLine('', 'system');
            appendTerminalLine('Tip: Click the Help button for hints!', 'system');
        }

    } catch (err) {
        state.pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
        let errorMsg = err.message;
        const lines = errorMsg.split('\n');
        lines.forEach(l => {
            if (l.trim()) appendTerminalLine(l, 'error');
        });
        appendTerminalLine('', 'system');
        appendTerminalLine('Submission failed - fix errors and try again.', 'error');
    }
}

function showCompletionModal(challenge) {
    const nextIdx = state.currentChallenge + 1;
    const hasNext = nextIdx < CHALLENGES.length;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-content fade-in">
            <div class="modal-icon"><i class="fa-solid fa-circle-check"></i></div>
            <h2>Challenge Complete!</h2>
            <p>You solved "${challenge.title}" - great work!</p>
            <p style="color: var(--accent-yellow); font-size: 14px;">Streak: ${state.streak} ${state.streak >= 3 ? '(on fire!)' : ''}</p>
            <div class="modal-actions">
                ${hasNext ? `<button class="btn btn-primary" id="btn-next-challenge">
                    <i class="fa-solid fa-arrow-right"></i> Next Challenge
                </button>` : `<button class="btn btn-success" id="btn-all-done">
                    <i class="fa-solid fa-trophy"></i> All Done!
                </button>`}
                <button class="btn btn-secondary" id="btn-close-modal">
                    <i class="fa-solid fa-xmark"></i> Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.id === 'btn-close-modal' || e.target.closest('#btn-close-modal')) {
            overlay.remove();
        }
        if (e.target.id === 'btn-next-challenge' || e.target.closest('#btn-next-challenge')) {
            overlay.remove();
            loadChallenge(nextIdx);
        }
        if (e.target.id === 'btn-all-done' || e.target.closest('#btn-all-done')) {
            overlay.remove();
        }
    });
}

// ============================================
// Help Panel
// ============================================
function toggleHelp() {
    state.helpVisible = !state.helpVisible;
    const panel = document.getElementById('help-panel');
    const toggle = document.getElementById('help-toggle');

    if (state.helpVisible) {
        panel.classList.add('help-visible');
        panel.classList.remove('help-hidden');
        toggle.classList.add('active');
        populateHelpPanel();
    } else {
        panel.classList.remove('help-visible');
        panel.classList.add('help-hidden');
        toggle.classList.remove('active');
    }

    if (state.editor) state.editor.layout();
}

function populateHelpPanel() {
    const challenge = CHALLENGES[state.currentChallenge];
    const helpDiv = document.getElementById('help-content');

    let html = '';

    // Code Analysis section
    html += `
        <div class="help-section">
            <div class="help-section-title">Code Analysis</div>
            <div id="code-analysis-content"></div>
        </div>
    `;

    // Concepts section
    html += `
        <div class="help-section">
            <div class="help-section-title">Key Concepts</div>
            ${challenge.helpContent.concepts}
        </div>
    `;

    // Hints section
    html += `
        <div class="help-section">
            <div class="help-section-title">Hints (click to reveal)</div>
    `;

    challenge.hints.forEach((hint, i) => {
        html += `
            <div class="hint-card" data-hint="${i}">
                <div class="hint-card-header">
                    <i class="fa-solid fa-lightbulb"></i>
                    ${hint.title}
                    <span class="hint-toggle">Click to reveal</span>
                </div>
                <div class="hint-card-body">${hint.content}</div>
            </div>
        `;
    });

    html += '</div>';

    // Common Errors section
    html += `
        <div class="help-section">
            <div class="help-section-title">Common Errors</div>
    `;

    challenge.helpContent.commonErrors.forEach(err => {
        html += `
            <div class="help-error-callout">
                <div class="callout-title"><i class="fa-solid fa-circle-xmark"></i> ${escapeHtml(err.error)}</div>
                <p>${err.fix}</p>
            </div>
        `;
    });

    html += '</div>';

    helpDiv.innerHTML = html;

    // Hint reveal click handlers
    helpDiv.querySelectorAll('.hint-card').forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('revealed');
            const toggle = card.querySelector('.hint-toggle');
            toggle.textContent = card.classList.contains('revealed') ? 'Click to hide' : 'Click to reveal';
        });
    });

    // Run code analysis
    analyzeCode();
}

function analyzeCode() {
    const code = state.editor ? state.editor.getValue() : '';
    const challenge = CHALLENGES[state.currentChallenge];
    const analysisDiv = document.getElementById('code-analysis-content');
    if (!analysisDiv) return;

    let suggestions = [];
    let issues = [];

    // Check if code is still the starter (unchanged)
    if (code.trim() === challenge.starterCode.trim()) {
        analysisDiv.innerHTML = `
            <div class="code-analysis">
                <div class="analysis-title">Status</div>
                <p style="color: var(--text-secondary);">You haven't modified the starter code yet. Start by replacing the <code>pass</code> statements or filling in the blanks.</p>
            </div>
        `;
        return;
    }

    // Basic checks
    if (code.includes('pass') && challenge.starterCode.includes('pass')) {
        issues.push('You still have <code>pass</code> placeholder statements. Replace them with actual code.');
    }

    if (code.includes('print') && challenge.id >= 7) {
        const printInsideFunc = /def\s+\w+[^:]+:[\s\S]*?print\s*\(/;
        if (printInsideFunc.test(code) && challenge.solution.includes('return')) {
            suggestions.push('Consider using <code>return</code> instead of <code>print()</code> inside functions.');
        }
    }

    // Check for common patterns
    if (code.includes('= =')) {
        issues.push('Found <code>= =</code> - did you mean <code>==</code> (comparison)?');
    }

    if (/\bTrue\b/.test(code) === false && /\btrue\b/.test(code)) {
        issues.push('Python uses <code>True</code> (capitalized), not <code>true</code>.');
    }

    if (/\bFalse\b/.test(code) === false && /\bfalse\b/.test(code)) {
        issues.push('Python uses <code>False</code> (capitalized), not <code>false</code>.');
    }

    // Length comparison with solution
    const codeLines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).length;
    const solutionLines = challenge.solution.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).length;

    if (codeLines > 0 && codeLines < solutionLines * 0.5) {
        suggestions.push('Your code seems shorter than expected. Make sure you\'ve completed all parts of the challenge.');
    }

    // Build HTML
    let html = '';

    if (issues.length > 0) {
        html += `<div class="help-error-callout">
            <div class="callout-title"><i class="fa-solid fa-triangle-exclamation"></i> Issues Found</div>
            <ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>`;
    }

    if (suggestions.length > 0) {
        html += `<div class="code-analysis">
            <div class="analysis-title">Suggestions</div>
            <ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
        </div>`;
    }

    if (issues.length === 0 && suggestions.length === 0 && codeLines > 0) {
        html += `<div class="help-success-callout">
            <div class="callout-title"><i class="fa-solid fa-circle-check"></i> Looking Good!</div>
            <p>No obvious issues detected. Try running your code or submitting to check if it produces the correct output.</p>
        </div>`;
    }

    analysisDiv.innerHTML = html;
}

// ============================================
// UI Components
// ============================================
function updateFileTree() {
    const tree = document.getElementById('file-tree');

    let html = `
        <div class="file-item folder">
            <span class="folder-icon"><i class="fa-solid fa-folder-open"></i></span>
            challenges
        </div>
    `;

    CHALLENGES.forEach((ch, i) => {
        const isActive = i === state.currentChallenge;
        const isCompleted = state.completedChallenges.has(ch.id);
        const statusClass = isCompleted ? 'completed' : (i === state.currentChallenge ? 'in-progress' : '');

        html += `
            <div class="file-item ${isActive ? 'active' : ''}" data-index="${i}" style="padding-left: 36px;">
                <span class="file-icon python"><i class="fa-brands fa-python"></i></span>
                ${ch.filename}
                <span class="status-dot ${statusClass}"></span>
            </div>
        `;
    });

    tree.innerHTML = html;

    // Click handlers
    tree.querySelectorAll('.file-item[data-index]').forEach(item => {
        item.addEventListener('click', () => {
            loadChallenge(parseInt(item.dataset.index));
        });
    });
}

function updateChallengeList() {
    const list = document.getElementById('challenge-list');

    let html = '';
    CHALLENGES.forEach((ch, i) => {
        const isActive = i === state.currentChallenge;
        const isCompleted = state.completedChallenges.has(ch.id);

        html += `
            <div class="challenge-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" data-index="${i}">
                <div class="challenge-item-header">
                    <span class="challenge-number">${ch.id}</span>
                    <span class="challenge-title">${ch.title}</span>
                    ${isCompleted
                        ? '<span class="challenge-status-icon completed"><i class="fa-solid fa-circle-check"></i></span>'
                        : ''}
                </div>
                <div class="challenge-meta">
                    <span class="challenge-difficulty difficulty-${ch.difficulty}">${ch.difficulty}</span>
                    <span style="color: var(--text-muted); font-size: 11px;">${ch.category}</span>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;

    // Click handlers
    list.querySelectorAll('.challenge-item').forEach(item => {
        item.addEventListener('click', () => {
            loadChallenge(parseInt(item.dataset.index));
        });
    });
}

function updateEditorTabs() {
    const tabList = document.getElementById('tab-list');
    const challenge = CHALLENGES[state.currentChallenge];

    // For simplicity, show one active tab
    tabList.innerHTML = `
        <div class="editor-tab active">
            <span class="tab-icon"><i class="fa-brands fa-python"></i></span>
            ${challenge.filename}
            <span class="tab-close"><i class="fa-solid fa-xmark"></i></span>
        </div>
    `;
}

function updateProgress() {
    const total = CHALLENGES.length;
    const completed = state.completedChallenges.size;
    const percent = Math.round((completed / total) * 100);

    // Progress ring
    const circle = document.getElementById('progress-circle');
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    document.getElementById('progress-percent').textContent = percent + '%';
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-remaining').textContent = total - completed;
    document.getElementById('stat-streak').textContent = state.streak;

    // Level
    let level = 'Beginner';
    let levelPercent = 0;
    if (completed >= 8) { level = 'Advanced'; levelPercent = (completed - 8) / 2 * 100; }
    else if (completed >= 5) { level = 'Intermediate'; levelPercent = (completed - 5) / 3 * 100; }
    else if (completed >= 2) { level = 'Elementary'; levelPercent = (completed - 2) / 3 * 100; }
    else { levelPercent = completed / 2 * 100; }

    document.querySelector('.level-badge').textContent = level;
    document.getElementById('level-fill').style.width = Math.min(100, levelPercent) + '%';
}

// ============================================
// UI Setup & Event Handlers
// ============================================
function setupUI() {
    // Activity bar navigation
    document.querySelectorAll('.activity-icon[data-panel]').forEach(icon => {
        icon.addEventListener('click', () => {
            // Update active icon
            document.querySelectorAll('.activity-icon').forEach(i => i.classList.remove('active'));
            icon.classList.add('active');

            // Show corresponding panel
            const panelId = 'panel-' + icon.dataset.panel;
            document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(panelId).classList.add('active');
        });
    });

    // Start Coding button
    document.getElementById('btn-start-coding').addEventListener('click', showEditor);

    // Run button
    document.getElementById('btn-run').addEventListener('click', runCode);

    // Clear terminal
    document.getElementById('btn-clear').addEventListener('click', clearTerminal);

    // Submit button
    document.getElementById('btn-submit').addEventListener('click', submitSolution);

    // Help toggle
    document.getElementById('help-toggle').addEventListener('click', toggleHelp);
    document.getElementById('help-close').addEventListener('click', toggleHelp);

    // Terminal input handler
    document.getElementById('terminal-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && state.inputResolve) {
            const value = e.target.value;
            state.inputResolve(value);
            state.inputResolve = null;
            e.target.value = '';
        }
    });

    // Terminal resize
    setupTerminalResize();

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const results = document.getElementById('search-results');

        if (!query) {
            results.innerHTML = '';
            return;
        }

        let html = '';
        CHALLENGES.forEach((ch, i) => {
            if (ch.title.toLowerCase().includes(query) ||
                ch.category.toLowerCase().includes(query) ||
                ch.objectives.some(o => o.toLowerCase().includes(query))) {
                html += `
                    <div class="challenge-item" data-index="${i}">
                        <div class="challenge-item-header">
                            <span class="challenge-number">${ch.id}</span>
                            <span class="challenge-title">${ch.title}</span>
                        </div>
                    </div>
                `;
            }
        });

        results.innerHTML = html || '<p style="padding: 8px 16px; color: var(--text-muted);">No results found.</p>';

        results.querySelectorAll('.challenge-item').forEach(item => {
            item.addEventListener('click', () => {
                loadChallenge(parseInt(item.dataset.index));
            });
        });
    });

    // Periodically update code analysis if help is open
    if (state.editor) {
        state.editor.onDidChangeModelContent(() => {
            if (state.helpVisible) {
                // Debounced analysis
                clearTimeout(state._analysisTimer);
                state._analysisTimer = setTimeout(analyzeCode, 500);
            }
        });
    }

    // Build initial sidebar content
    updateFileTree();
    updateChallengeList();
    updateProgress();
}

function setupTerminalResize() {
    const handle = document.getElementById('terminal-resize-handle');
    const terminal = document.getElementById('terminal-panel');
    let startY, startHeight;

    handle.addEventListener('mousedown', (e) => {
        startY = e.clientY;
        startHeight = terminal.offsetHeight;

        const onMouseMove = (e) => {
            const delta = startY - e.clientY;
            const newHeight = Math.max(100, Math.min(600, startHeight + delta));
            terminal.style.height = newHeight + 'px';
            if (state.editor) state.editor.layout();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

// ============================================
// Start the application
// ============================================
document.addEventListener('DOMContentLoaded', init);
