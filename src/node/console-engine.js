const vm = require('node:vm');
const { Writable } = require('node:stream');

class ConsoleEngine {
  constructor(options = {}) {
    this.timeout = options.timeout || 5000; // 5 second default timeout
    this.maxOutputLength = options.maxOutputLength || 10000;
    this.sessions = new Map(); // sessionId -> context
    this.exposedGlobals = options.exposedGlobals || {};
  }

  /**
   * Get or create a console session
   * @param {string} sessionId - Unique session identifier
   * @returns {Object} VM context for the session
   */
  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      // Create a new VM context with safe globals
      const context = vm.createContext({
        console: this.createConsoleProxy(),
        require: this.createSafeRequire(),
        Buffer,
        process: {
          env: process.env,
          version: process.version,
          platform: process.platform,
          // Exclude dangerous process methods
        },
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        // Add any exposed globals from the host app
        ...this.exposedGlobals,
      });
      
      this.sessions.set(sessionId, context);
    }
    
    return this.sessions.get(sessionId);
  }

  /**
   * Execute code in a session context
   * @param {string} code - JavaScript code to execute
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} Result object with output, error, or value
   */
  async execute(code, sessionId) {
    const context = this.getSession(sessionId);
    const output = [];
    
    // Capture console output by replacing the console object
    context.console = this.createConsoleProxy(output);

    try {
      const script = new vm.Script(code, {
        filename: 'debug-console',
        timeout: this.timeout,
      });

      const result = script.runInContext(context, {
        timeout: this.timeout,
      });

      // Handle promises
      let finalResult = result;
      if (result && typeof result.then === 'function') {
        finalResult = await Promise.race([
          result,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Promise timeout')), this.timeout)
          )
        ]);
      }

      const outputText = output.join('');
      
      return {
        success: true,
        output: this.truncateOutput(outputText),
        value: this.formatValue(finalResult),
        type: typeof finalResult,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        output: this.truncateOutput(output.join('')),
      };
    }
  }

  /**
   * Create a console proxy that captures output
   * @param {Array} output - Array to capture output to
   * @returns {Object} Console-like object that captures output
   */
  createConsoleProxy(output = []) {
    return {
      log: (...args) => {
        const message = args.map(arg => this.formatConsoleValue(arg)).join(' ') + '\n';
        output.push(message);
      },
      error: (...args) => {
        const message = 'ERROR: ' + args.map(arg => this.formatConsoleValue(arg)).join(' ') + '\n';
        output.push(message);
      },
      warn: (...args) => {
        const message = 'WARN: ' + args.map(arg => this.formatConsoleValue(arg)).join(' ') + '\n';
        output.push(message);
      },
      info: (...args) => {
        const message = 'INFO: ' + args.map(arg => this.formatConsoleValue(arg)).join(' ') + '\n';
        output.push(message);
      },
    };
  }

  /**
   * Create a safer require function that allows only certain modules
   * @returns {Function} Restricted require function
   */
  createSafeRequire() {
    const allowedModules = new Set([
      'crypto',
      'util',
      'path',
      'querystring',
      'url',
      'events',
      // Add more safe modules as needed
    ]);

    return (moduleName) => {
      if (allowedModules.has(moduleName)) {
        return require(moduleName);
      }
      throw new Error(`Module '${moduleName}' is not allowed in debug console`);
    };
  }

  /**
   * Format a value for display as return value
   * @param {*} value - Value to format
   * @returns {string} Formatted string representation
   */
  formatValue(value) {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (value instanceof Error) return value.stack || value.toString();
    
    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      return value.toString();
    }
  }

  /**
   * Format a value for console output (without quotes for strings)
   * @param {*} value - Value to format
   * @returns {string} Formatted string representation
   */
  formatConsoleValue(value) {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (value instanceof Error) return value.stack || value.toString();
    
    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      return value.toString();
    }
  }

  /**
   * Truncate output if it's too long
   * @param {string} output - Output to truncate
   * @returns {string} Truncated output
   */
  truncateOutput(output) {
    if (output.length > this.maxOutputLength) {
      return output.substring(0, this.maxOutputLength) + 
             `\n... (truncated, ${output.length - this.maxOutputLength} characters omitted)`;
    }
    return output;
  }

  /**
   * Clear a session
   * @param {string} sessionId - Session to clear
   */
  clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      sessionIds: Array.from(this.sessions.keys()),
    };
  }

  /**
   * Expose global variables/objects to all sessions
   * @param {string} name - Variable name
   * @param {*} value - Variable value
   */
  exposeGlobal(name, value) {
    this.exposedGlobals[name] = value;
    // Update existing sessions
    for (const context of this.sessions.values()) {
      context[name] = value;
    }
  }
}

module.exports = ConsoleEngine;