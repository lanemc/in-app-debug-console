import os
import logging
from typing import Callable, Optional, Dict, Any
from flask import Blueprint, request, jsonify, render_template_string, session, current_app
from werkzeug.exceptions import Forbidden

from .console_engine import ConsoleEngine


# HTML template for the console UI
CONSOLE_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Console - {{ app_name }}</title>
    <style>
        body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background-color: #1e1e1e;
            color: #d4d4d4;
            margin: 0;
            padding: 20px;
            line-height: 1.4;
        }
        .header {
            background-color: #ff6b6b;
            color: white;
            padding: 10px 20px;
            margin: -20px -20px 20px -20px;
            font-weight: bold;
            text-align: center;
        }
        .console-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .output {
            background-color: #252526;
            border: 1px solid #3e3e42;
            padding: 15px;
            height: 400px;
            overflow-y: auto;
            margin-bottom: 10px;
            white-space: pre-wrap;
            font-size: 14px;
        }
        .input-container {
            display: flex;
            gap: 10px;
        }
        .code-input {
            flex: 1;
            background-color: #1e1e1e;
            color: #d4d4d4;
            border: 1px solid #3e3e42;
            padding: 10px;
            font-family: inherit;
            font-size: 14px;
            min-height: 60px;
            resize: vertical;
        }
        .execute-btn {
            background-color: #007acc;
            color: white;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
            align-self: flex-start;
        }
        .execute-btn:hover {
            background-color: #106ba3;
        }
        .execute-btn:disabled {
            background-color: #555;
            cursor: not-allowed;
        }
        .clear-btn {
            background-color: #6c757d;
            color: white;
            border: none;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 14px;
            align-self: flex-start;
        }
        .clear-btn:hover {
            background-color: #5a6268;
        }
        .error {
            color: #f48771;
        }
        .success {
            color: #608b4e;
        }
        .prompt {
            color: #569cd6;
        }
        .stats {
            font-size: 12px;
            color: #858585;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        ⚠️ DEBUG CONSOLE - AUTHORIZED PERSONNEL ONLY - ALL ACTIONS ARE LOGGED ⚠️
    </div>
    
    <div class="console-container">
        <div class="output" id="output">
            <div class="success">Debug Console initialized for {{ app_name }}</div>
            <div class="prompt">>>> </div>
        </div>
        
        <div class="input-container">
            <textarea class="code-input" id="codeInput" placeholder="Enter Python code..."></textarea>
            <button class="execute-btn" id="executeBtn" onclick="executeCode()">Execute</button>
            <button class="clear-btn" onclick="clearConsole()">Clear</button>
        </div>
        
        <div class="stats" id="stats">
            Session: {{ session_id }} | Ready
        </div>
    </div>

    <script>
        const output = document.getElementById('output');
        const codeInput = document.getElementById('codeInput');
        const executeBtn = document.getElementById('executeBtn');
        const stats = document.getElementById('stats');
        let commandHistory = [];
        let historyIndex = -1;

        // Handle keyboard shortcuts
        codeInput.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                executeCode();
            } else if (e.key === 'ArrowUp' && commandHistory.length > 0) {
                e.preventDefault();
                if (historyIndex === -1) historyIndex = commandHistory.length - 1;
                else if (historyIndex > 0) historyIndex--;
                codeInput.value = commandHistory[historyIndex];
            } else if (e.key === 'ArrowDown' && historyIndex !== -1) {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    codeInput.value = commandHistory[historyIndex];
                } else {
                    historyIndex = -1;
                    codeInput.value = '';
                }
            }
        });

        async function executeCode() {
            const code = codeInput.value.trim();
            if (!code) return;

            // Add to history
            commandHistory.push(code);
            historyIndex = -1;

            // Show executing state
            executeBtn.disabled = true;
            executeBtn.textContent = 'Executing...';
            
            // Add command to output
            appendToOutput(`<span class="prompt">>>> </span>${escapeHtml(code)}`);

            try {
                const response = await fetch('{{ url_for("console.execute") }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ code: code })
                });

                const result = await response.json();
                
                if (result.success) {
                    if (result.output) {
                        appendToOutput(`<span class="success">${escapeHtml(result.output)}</span>`);
                    }
                    if (result.needs_more) {
                        appendToOutput(`<span class="prompt">... </span>`);
                    } else {
                        appendToOutput(`<span class="prompt">>>> </span>`);
                    }
                } else {
                    appendToOutput(`<span class="error">Error: ${escapeHtml(result.error || 'Unknown error')}</span>`);
                    if (result.traceback) {
                        appendToOutput(`<span class="error">${escapeHtml(result.traceback)}</span>`);
                    }
                    appendToOutput(`<span class="prompt">>>> </span>`);
                }

            } catch (error) {
                appendToOutput(`<span class="error">Network Error: ${escapeHtml(error.message)}</span>`);
                appendToOutput(`<span class="prompt">>>> </span>`);
            } finally {
                executeBtn.disabled = false;
                executeBtn.textContent = 'Execute';
                codeInput.value = '';
                codeInput.focus();
            }
        }

        function appendToOutput(content) {
            output.innerHTML += content + '\\n';
            output.scrollTop = output.scrollHeight;
        }

        function clearConsole() {
            output.innerHTML = '<div class="success">Console cleared</div>\\n<div class="prompt">>>> </div>';
            codeInput.focus();
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Focus input on load
        codeInput.focus();
    </script>
</body>
</html>
"""


class ConsoleBlueprint:
    """Flask blueprint for the debug console"""
    
    def __init__(self, name: str = 'console', url_prefix: str = '/__console__',
                 auth_func: Optional[Callable] = None, 
                 console_engine: Optional[ConsoleEngine] = None,
                 enable_logging: bool = True):
        self.name = name
        self.url_prefix = url_prefix
        self.auth_func = auth_func
        self.console_engine = console_engine or ConsoleEngine()
        self.enable_logging = enable_logging
        self.blueprint = self._create_blueprint()
        
        if enable_logging:
            self.logger = logging.getLogger(f'debug_console.{name}')
    
    def _create_blueprint(self) -> Blueprint:
        """Create the Flask blueprint"""
        bp = Blueprint(self.name, __name__, url_prefix=self.url_prefix)
        
        @bp.before_request
        def check_auth():
            """Check authentication before allowing access"""
            if self.auth_func and not self.auth_func():
                raise Forbidden("Access denied to debug console")
        
        @bp.route('/', methods=['GET'])
        def console_page():
            """Serve the console UI"""
            session_id = self._get_session_id()
            app_name = getattr(current_app, 'name', 'Flask App')
            
            if self.enable_logging:
                self.logger.info(f"Console page accessed by session {session_id}")
            
            return render_template_string(
                CONSOLE_HTML,
                app_name=app_name,
                session_id=session_id
            )
        
        @bp.route('/execute', methods=['POST'])
        def execute():
            """Execute code endpoint"""
            if not request.is_json:
                return jsonify({'success': False, 'error': 'Content-Type must be application/json'}), 400
            
            data = request.get_json()
            code = data.get('code', '').strip()
            
            if not code:
                return jsonify({'success': False, 'error': 'No code provided'})
            
            session_id = self._get_session_id()
            
            if self.enable_logging:
                self.logger.info(f"Executing code in session {session_id}: {repr(code[:100])}")
            
            # Execute the code
            result = self.console_engine.execute(code, session_id)
            
            if self.enable_logging:
                self.logger.info(f"Execution result for session {session_id}: success={result.get('success')}")
                if not result.get('success'):
                    self.logger.warning(f"Execution error: {result.get('error')}")
            
            return jsonify(result)
        
        @bp.route('/stats', methods=['GET'])
        def stats():
            """Get console statistics"""
            return jsonify(self.console_engine.get_stats())
        
        @bp.route('/clear/<session_id>', methods=['POST'])
        def clear_session(session_id: str):
            """Clear a specific session"""
            self.console_engine.clear_session(session_id)
            
            if self.enable_logging:
                self.logger.info(f"Cleared session {session_id}")
            
            return jsonify({'success': True, 'message': f'Session {session_id} cleared'})
        
        return bp
    
    def _get_session_id(self) -> str:
        """Get or create a session ID"""
        if 'debug_console_session' not in session:
            import uuid
            session['debug_console_session'] = str(uuid.uuid4())
        return session['debug_console_session']


def create_console_blueprint(auth_func: Optional[Callable] = None,
                           url_prefix: str = '/__console__',
                           timeout: int = 5,
                           max_output_length: int = 10000,
                           exposed_globals: Optional[Dict[str, Any]] = None,
                           enable_logging: bool = True) -> Blueprint:
    """
    Create a debug console blueprint with the given configuration
    
    Args:
        auth_func: Function to check if current user can access console
        url_prefix: URL prefix for console routes
        timeout: Code execution timeout in seconds
        max_output_length: Maximum length of output before truncation
        exposed_globals: Global variables to expose in console
        enable_logging: Whether to enable audit logging
    
    Returns:
        Flask Blueprint for the debug console
    """
    console_engine = ConsoleEngine(
        timeout=timeout,
        max_output_length=max_output_length,
        exposed_globals=exposed_globals
    )
    
    console_bp = ConsoleBlueprint(
        url_prefix=url_prefix,
        auth_func=auth_func,
        console_engine=console_engine,
        enable_logging=enable_logging
    )
    
    return console_bp.blueprint