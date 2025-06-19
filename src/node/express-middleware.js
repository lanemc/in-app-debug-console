const express = require('express');
const ConsoleEngine = require('./console-engine');
// Generate UUID function
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// HTML template for the console UI
const CONSOLE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Console - {{APP_NAME}}</title>
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
            <div class="success">Debug Console initialized for {{APP_NAME}}</div>
            <div class="prompt">>>> </div>
        </div>
        
        <div class="input-container">
            <textarea class="code-input" id="codeInput" placeholder="Enter JavaScript code..."></textarea>
            <button class="execute-btn" id="executeBtn" onclick="executeCode()">Execute</button>
            <button class="clear-btn" onclick="clearConsole()">Clear</button>
        </div>
        
        <div class="stats" id="stats">
            Session: {{SESSION_ID}} | Ready
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
            appendToOutput('<span class="prompt">>>> </span>' + escapeHtml(code));

            try {
                const response = await fetch('/{{URL_PREFIX}}/execute', {
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
                        appendToOutput('<span class="success">' + escapeHtml(result.output) + '</span>');
                    }
                    if (result.value !== undefined) {
                        appendToOutput('<span class="success">' + escapeHtml(result.value) + '</span>');
                    }
                } else {
                    appendToOutput('<span class="error">Error: ' + escapeHtml(result.error || 'Unknown error') + '</span>');
                    if (result.stack) {
                        appendToOutput('<span class="error">' + escapeHtml(result.stack) + '</span>');
                    }
                }
                appendToOutput('<span class="prompt">>>> </span>');

            } catch (error) {
                appendToOutput('<span class="error">Network Error: ' + escapeHtml(error.message) + '</span>');
                appendToOutput('<span class="prompt">>>> </span>');
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
`;

/**
 * Create Express middleware for the debug console
 * @param {Object} options - Configuration options
 * @param {Function} options.authCheck - Function to check if user is authorized
 * @param {string} options.route - Route path for console (default: '/__console__')
 * @param {number} options.timeout - Code execution timeout in ms (default: 5000)
 * @param {number} options.maxOutputLength - Maximum output length (default: 10000)
 * @param {Object} options.exposedGlobals - Global objects to expose in console
 * @param {boolean} options.enableLogging - Enable audit logging (default: true)
 * @param {string} options.appName - Application name for UI (default: 'Node.js App')
 * @returns {express.Router} Express router for the console
 */
function createConsoleMiddleware(options = {}) {
  const {
    authCheck = () => false,
    route = '/__console__',
    timeout = 5000,
    maxOutputLength = 10000,
    exposedGlobals = {},
    enableLogging = true,
    appName = 'Node.js App'
  } = options;

  const router = express.Router();
  const consoleEngine = new ConsoleEngine({
    timeout,
    maxOutputLength,
    exposedGlobals
  });

  // Create logger if enabled
  let logger;
  if (enableLogging) {
    logger = {
      info: (msg) => console.log(`[DEBUG-CONSOLE] ${new Date().toISOString()} INFO: ${msg}`),
      warn: (msg) => console.log(`[DEBUG-CONSOLE] ${new Date().toISOString()} WARN: ${msg}`),
      error: (msg) => console.log(`[DEBUG-CONSOLE] ${new Date().toISOString()} ERROR: ${msg}`)
    };
  }

  // Auth middleware
  router.use((req, res, next) => {
    if (!authCheck(req)) {
      if (enableLogging) {
        logger.warn(`Unauthorized access attempt from ${req.ip}`);
      }
      return res.status(403).json({ error: 'Forbidden: Access denied to debug console' });
    }
    next();
  });

  // Serve console UI
  router.get('/', (req, res) => {
    // Generate session ID
    const sessionId = req.session?.debugConsoleSession || 
                     req.headers['x-debug-session'] || 
                     uuidv4();
    
    // Store session ID if using express-session
    if (req.session) {
      req.session.debugConsoleSession = sessionId;
    }

    if (enableLogging) {
      logger.info(`Console page accessed by session ${sessionId} from ${req.ip}`);
    }

    const html = CONSOLE_HTML
      .replace(/{{APP_NAME}}/g, appName)
      .replace(/{{SESSION_ID}}/g, sessionId)
      .replace(/{{URL_PREFIX}}/g, route.replace(/^\//, ''));

    res.type('html').send(html);
  });

  // Execute code endpoint
  router.post('/execute', express.json(), async (req, res) => {
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Code parameter is required and must be a string' 
      });
    }

    // Get session ID
    const sessionId = req.session?.debugConsoleSession || 
                     req.headers['x-debug-session'] || 
                     'default';

    if (enableLogging) {
      logger.info(`Executing code in session ${sessionId}: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);
    }

    try {
      const result = await consoleEngine.execute(code, sessionId);
      
      if (enableLogging) {
        logger.info(`Execution result for session ${sessionId}: success=${result.success}`);
        if (!result.success) {
          logger.warn(`Execution error: ${result.error}`);
        }
      }

      res.json(result);
    } catch (error) {
      if (enableLogging) {
        logger.error(`Execution exception: ${error.message}`);
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error during code execution',
        details: error.message
      });
    }
  });

  // Get stats endpoint
  router.get('/stats', (req, res) => {
    const stats = consoleEngine.getStats();
    res.json(stats);
  });

  // Clear session endpoint
  router.post('/clear/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    consoleEngine.clearSession(sessionId);
    
    if (enableLogging) {
      logger.info(`Cleared session ${sessionId}`);
    }
    
    res.json({ success: true, message: `Session ${sessionId} cleared` });
  });

  // Expose global function
  router.consoleEngine = consoleEngine;

  return router;
}

/**
 * Simple auth check function that checks for admin role
 * @param {express.Request} req - Express request object
 * @returns {boolean} Whether user is authorized
 */
function defaultAuthCheck(req) {
  // Check for admin role in various places
  return req.user?.role === 'admin' || 
         req.user?.isAdmin === true ||
         req.session?.user?.role === 'admin' ||
         req.headers['x-admin-token'] === process.env.DEBUG_CONSOLE_TOKEN;
}

module.exports = {
  createConsoleMiddleware,
  defaultAuthCheck,
  ConsoleEngine
};