/**
 * In-App Debug Console for Node.js/Express Applications
 * 
 * A secure, built-in mini REPL console for web applications that enables 
 * developers to inspect server state and execute debug commands on a running app.
 */

const { createConsoleMiddleware, defaultAuthCheck, ConsoleEngine } = require('./express-middleware');

// Main exports
module.exports = {
  // Core functionality
  createConsoleMiddleware,
  ConsoleEngine,
  
  // Utilities
  defaultAuthCheck,
  
  // Convenience function for quick setup
  create: createConsoleMiddleware,
  
  // Version
  version: '1.0.0'
};

// Default export for ES6 compatibility
module.exports.default = module.exports;