const express = require('express');
const session = require('express-session');
const { createConsoleMiddleware } = require('../../src/node');

const app = express();
const PORT = process.env.PORT || 3000;

// Sample application state
const appData = {
  users: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
    { id: 3, name: 'Charlie', role: 'user' }
  ],
  stats: {
    requests: 0,
    uptime: Date.now()
  },
  cache: new Map()
};

// Middleware
app.use(express.json());
app.use(session({
  secret: 'debug-console-demo',
  resave: false,
  saveUninitialized: false
}));

// Simple auth middleware for demo
app.use((req, res, next) => {
  // Simulate user authentication
  if (req.headers.authorization === 'Bearer admin-token') {
    req.user = { id: 1, name: 'Admin', role: 'admin' };
  }
  appData.stats.requests++;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Debug Console Demo App',
    user: req.user || null,
    stats: appData.stats,
    instructions: {
      login: 'Send "Authorization: Bearer admin-token" header to login as admin',
      console: 'Visit /__console__ to access debug console (admin only)',
      routes: ['/users', '/stats', '/cache']
    }
  });
});

app.get('/users', (req, res) => {
  res.json(appData.users);
});

app.get('/stats', (req, res) => {
  res.json({
    ...appData.stats,
    uptime: Date.now() - appData.stats.uptime
  });
});

app.get('/cache', (req, res) => {
  res.json(Object.fromEntries(appData.cache));
});

app.post('/cache/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  appData.cache.set(key, value);
  res.json({ message: `Cached ${key}`, value });
});

// Auth check for console
function consoleAuthCheck(req) {
  // Allow access if user has admin role
  return req.user && req.user.role === 'admin';
}

// Setup debug console
const consoleMiddleware = createConsoleMiddleware({
  authCheck: consoleAuthCheck,
  appName: 'Debug Console Demo (Node.js)',
  exposedGlobals: {
    // Expose app data to console
    appData,
    users: appData.users,
    stats: appData.stats,
    cache: appData.cache,
    
    // Utility functions
    getUser: (id) => appData.users.find(u => u.id === id),
    addUser: (name, role = 'user') => {
      const user = { id: Date.now(), name, role };
      appData.users.push(user);
      return user;
    },
    clearCache: () => {
      appData.cache.clear();
      return 'Cache cleared';
    },
    getUptime: () => Date.now() - appData.stats.uptime
  }
});

app.use('/__console__', consoleMiddleware);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`\\n🚀 Debug Console Demo App running on port ${PORT}`);
  console.log(`\\n📊 Available endpoints:`);
  console.log(`   GET  / - App info and instructions`);
  console.log(`   GET  /users - List users`);
  console.log(`   GET  /stats - App statistics`);
  console.log(`   GET  /cache - View cache contents`);
  console.log(`   POST /cache/:key - Set cache value`);
  console.log(`\\n🐛 Debug Console:`);
  console.log(`   GET  /__console__ - Debug console (admin only)`);
  console.log(`\\n🔑 To access console:`);
  console.log(`   1. Send request with header: Authorization: Bearer admin-token`);
  console.log(`   2. Visit http://localhost:${PORT}/__console__`);
  console.log(`\\n💡 Try these commands in the console:`);
  console.log(`   appData.users`);
  console.log(`   getUser(1)`);
  console.log(`   addUser("Test User", "admin")`);
  console.log(`   stats.requests`);
  console.log(`   clearCache()`);
  console.log(`   console.log("Hello from debug console!")`);
});