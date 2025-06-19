# 🐛✨ In-App Live Debug Console

> **Debug your live applications like a wizard** 🧙‍♂️  
> No more deploy-pray-debug cycles. No more scattered console.logs. Just pure, interactive debugging bliss.

<div align="center">

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-brightgreen)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://python.org/)
[![Express](https://img.shields.io/badge/Express-4%2B-orange)](https://expressjs.com/)
[![Flask](https://img.shields.io/badge/Flask-2%2B-red)](https://flask.palletsprojects.com/)

**[🚀 Quick Start](#-quick-start)** • **[📺 Live Demo](#-see-it-in-action)** • **[🎯 Examples](#-examples)** • **[🔒 Security](#-security-first)**

</div>

---

## 🎬 What if debugging felt like this?

```javascript
// Instead of this nightmare...
console.log('User data:', user);  // Add log
git add . && git commit -m "debug log"  // Commit
git push  // Deploy
// Wait 2 minutes...
// Check logs...
// Still confused...
console.log('Maybe this?', user.preferences);  // Add more logs
git add . && git commit -m "more debug logs"  // Repeat...

// You could just do this...
>>> user
{ id: 123, name: "Jane", preferences: { theme: null } }  // Aha! Found the bug
>>> user.preferences.theme = 'dark'  // Fix it live
>>> saveUser(user)  // Test the fix
"User saved successfully"  // It works!
```

**Welcome to the future of debugging.** 🚀

---

## 💡 The Problem We Solve

We've all been there:

- 🔥 **Production is broken** and you have no idea why
- 🐌 **Deploy cycles take forever** just to add one debug line  
- 🤔 **Logs are confusing** and don't tell the whole story
- 💸 **APM tools are expensive** and overkill for small teams
- 🚫 **Can't attach debuggers** to cloud/containerized apps
- 😤 **Context switching kills flow** between IDE and server

**What if you could just... inspect your live app like a local REPL?**

---

## ✨ The Solution

**In-App Live Debug Console** gives you a **secure, interactive REPL** that runs **inside your live application**. Think Rails console or Node REPL, but accessible through your browser for any authorized developer.

### 🎯 Core Magic

- **🔬 Live Inspection** - See your app's real state, right now
- **⚡ Instant Feedback** - No deploy cycles, just immediate results  
- **🛡️ Production Safe** - Enterprise-grade security built-in
- **🌐 Web Access** - Debug from anywhere with just a browser
- **🔐 Your Auth** - Integrates with your existing authentication
- **🎨 Beautiful UI** - Modern console that developers actually love using

---

## 🚀 Quick Start

### ⚡ 60-Second Setup

<details>
<summary><strong>🟢 Node.js/Express</strong> (click to expand)</summary>

```bash
npm install in-app-debug-console
```

```javascript
const express = require('express');
const { createConsoleMiddleware } = require('in-app-debug-console');

const app = express();

// Your existing app...
const appData = { users: [], cache: new Map() };

// Add the magic ✨
app.use('/__console__', createConsoleMiddleware({
  authCheck: (req) => req.user?.role === 'admin',  // Your auth logic
  exposedGlobals: {
    appData,           // Expose your app's data
    users: appData.users,
    cache: appData.cache,
    // Add your utility functions
    findUser: (id) => appData.users.find(u => u.id === id)
  }
}));

app.listen(3000);
```

**That's it!** Visit `http://localhost:3000/__console__` 🎉

</details>

<details>
<summary><strong>🔵 Python/Flask</strong> (click to expand)</summary>

```bash
pip install in-app-debug-console
```

```python
from flask import Flask
from in_app_debug_console import create_console_blueprint

app = Flask(__name__)

# Your existing app...
app_data = {'users': [], 'cache': {}}

# Add the magic ✨
console_bp = create_console_blueprint(
    auth_func=lambda: current_user.role == 'admin',  # Your auth logic
    exposed_globals={
        'app_data': app_data,
        'users': app_data['users'], 
        'cache': app_data['cache'],
        'db': db,  # Your database
        # Add your utility functions
        'find_user': lambda id: next((u for u in app_data['users'] if u['id'] == id), None)
    }
)

app.register_blueprint(console_bp)
app.run()
```

**That's it!** Visit `http://localhost:5000/__console__` 🎉

</details>

---

## 📺 See It In Action

### 🎮 Interactive Demo Commands

Once you're in the console, try these:

<table>
<tr>
<td width="50%">

**🔍 Inspect Live Data**
```javascript
// See your users
>>> users
[{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}]

// Check app health  
>>> Object.keys(appData)
['users', 'cache', 'config', 'stats']

// Database queries (if exposed)
>>> db.users.count()
1337
```

</td>
<td width="50%">

**⚡ Live Modifications**
```javascript
// Toggle feature flags
>>> config.newFeature = true

// Fix data issues
>>> users.find(u => u.id === 123).status = 'active'

// Clear problematic cache
>>> cache.delete('user:broken-session')
```

</td>
</tr>
<tr>
<td>

**🧰 Call Your Functions**
```javascript
// Use your existing utilities
>>> findUser(123)
{id: 123, name: 'Jane', email: 'jane@example.com'}

// Generate reports
>>> generateDailyReport()
"Report generated: 1,234 active users"

// Health checks
>>> checkDatabaseConnection()
"✅ Database healthy - 2ms ping"
```

</td>
<td>

**🎯 Debug Issues**
```javascript
// Reproduce bugs
>>> simulatePaymentFlow('user123', 49.99)
"Error: Invalid payment method"

// Check environment
>>> process.env.NODE_ENV
"production"

// Memory usage
>>> process.memoryUsage()
{rss: 45678912, heapUsed: 23456789}
```

</td>
</tr>
</table>

---

## 🎯 Real-World Use Cases

### 🔥 Production Firefighting

```javascript
// 🚨 "Users can't checkout!"
>>> orderService.getStats()
{pending: 1234, processing: 0, failed: 892}

>>> orderService.processQueue()
"✅ Queue processed - 1234 orders completed"

// Crisis averted in 30 seconds! 🎉
```

### 🧪 Feature Flag Testing

```python
# 🚀 "Need to test the new dashboard"
>>> features['new_dashboard'] = True
>>> current_user.refresh_permissions()

# Test, then disable safely
>>> features['new_dashboard'] = False
```

### 🔍 Data Investigation

```javascript
// 🕵️ "Why is this user seeing weird data?"
>>> findUser('user123')
{id: 'user123', cached_data: null, last_refresh: '2023-01-01'}

>>> refreshUserCache('user123')
>>> findUser('user123') 
{id: 'user123', cached_data: {...}, last_refresh: '2023-10-15'}

// Mystery solved! 🎯
```

---

## 🛡️ Security First

We take security **seriously**. This isn't a dev tool accidentally left in production.

### 🔐 Multi-Layer Protection

```javascript
// 1. Strong Authentication Required
authCheck: (req) => {
  return req.user?.role === 'admin' &&
         req.user?.twoFactorVerified &&
         req.user?.permissions?.includes('debug_console');
}

// 2. Sandboxed Execution
// ✅ Safe: Your app's context
// ❌ Blocked: file system, process.exit, dangerous modules

// 3. Complete Audit Trail
// Every command logged with user, timestamp, result

// 4. Production Controls
// Timeout limits, output size limits, IP restrictions
```

### 🔒 Production Ready

- **🚫 Disabled by default** in production environments
- **📝 Complete audit logging** of all console activity  
- **⏱️ Execution timeouts** prevent runaway code
- **📏 Output limits** prevent memory exhaustion
- **🌐 HTTPS enforced** for secure communication
- **🏠 IP restrictions** for additional access control

[**🛡️ Read the complete Security Guide →**](docs/security.md)

---

## 🎨 Developer Experience

### ✨ Features You'll Love

- **📝 Command History** - Navigate with ↑/↓ arrows
- **⌨️ Keyboard Shortcuts** - Ctrl+Enter to execute  
- **🎨 Syntax Highlighting** - Errors in red, success in green
- **📱 Responsive Design** - Works on mobile for emergency debugging
- **🔄 Session Persistence** - Variables stay alive between commands
- **📊 Real-time Output** - See results as they happen

### 🎯 Designed for Flow

```javascript
// No more context switching
>>> users.filter(u => u.lastLogin > Date.now() - 86400000)
[{id: 1, name: 'Alice'}, {id: 3, name: 'Charlie'}]

// Chain operations naturally  
>>> recentUsers = users.filter(u => u.lastLogin > Date.now() - 86400000)
>>> recentUsers.forEach(u => sendWelcomeBack(u.email))
"✅ Sent 2 welcome back emails"

// Debug with context
>>> console.log('Processing user:', user.id, user.name)
Processing user: 123 Jane
```

---

## 📦 Examples & Templates

### 🎮 Try the Examples

We've built complete example apps so you can see it in action:

```bash
# 🟢 Node.js Example
git clone https://github.com/your-org/in-app-debug-console
cd examples/node-express
npm install && npm start
# Visit http://localhost:3000 and login with "Authorization: Bearer admin-token"

# 🔵 Python Example  
cd examples/python-flask
pip install -r requirements.txt && python app.py
# Visit http://localhost:5000 and login with "Authorization: Bearer admin-token"
```

### 🏗️ Integration Patterns

<details>
<summary><strong>🔐 Authentication Patterns</strong></summary>

```javascript
// JWT Authentication
authCheck: (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.role === 'admin';
}

// Session-based Auth
authCheck: (req) => {
  return req.session?.user?.role === 'admin';
}

// Multi-factor Required
authCheck: (req) => {
  return req.user?.role === 'admin' && 
         req.user?.mfaVerified &&
         Date.now() - req.user?.lastMfaCheck < 3600000; // 1 hour
}
```

</details>

<details>
<summary><strong>🎯 Exposed Globals Patterns</strong></summary>

```javascript
exposedGlobals: {
  // App State
  app: app,
  config: config,
  cache: redisClient,
  
  // Database  
  db: database,
  User: UserModel,
  Order: OrderModel,
  
  // Utilities
  utils: {
    generateReport: () => analytics.generate('daily'),
    clearCache: (key) => redis.del(key),
    healthCheck: () => ({ db: 'ok', redis: 'ok' })
  },
  
  // Debug Helpers
  debug: {
    enableVerboseLogging: () => logger.level = 'debug',
    getMemoryUsage: () => process.memoryUsage(),
    getCurrentSessions: () => sessionStore.getAll()
  }
}
```

</details>

---

## 🚀 Advanced Usage

### 🎭 Environment-Specific Setup

```javascript
const isDev = process.env.NODE_ENV === 'development';
const isStaging = process.env.NODE_ENV === 'staging';
const allowConsole = isDev || (isStaging && process.env.ENABLE_DEBUG_CONSOLE);

if (allowConsole) {
  app.use('/__console__', createConsoleMiddleware({
    authCheck: isDev ? () => true : strictProductionAuth,
    timeout: isDev ? 30000 : 5000,
    exposedGlobals: isDev ? devGlobals : limitedProdGlobals
  }));
}
```

### 🎨 Custom UI Integration

```javascript
// JSON API for custom frontends
GET /__console__/execute
POST /__console__/execute
{
  "code": "users.length",
  "sessionId": "my-session"
}

// Response
{
  "success": true,
  "output": "42",
  "type": "number"
}
```

### 📊 Monitoring Integration

```javascript
// Custom logging
createConsoleMiddleware({
  authCheck: myAuth,
  enableLogging: true,
  customLogger: {
    info: (msg) => winston.info(msg),
    warn: (msg) => winston.warn(msg),
    error: (msg) => winston.error(msg)
  }
});
```

---

## 🤝 Community & Support

### 💬 Get Help

- **📚 [Documentation](docs/)** - Complete guides and API reference
- **🐛 [Issues](https://github.com/your-org/in-app-debug-console/issues)** - Bug reports and feature requests  
- **💡 [Discussions](https://github.com/your-org/in-app-debug-console/discussions)** - Questions and community chat
- **🔒 [Security](mailto:security@example.com)** - Report security issues privately

### 🎉 Contributing

We love contributions! Here's how to get started:

```bash
git clone https://github.com/your-org/in-app-debug-console
cd in-app-debug-console
npm install  # or pip install -e .

# Make your changes
# Add tests
# Submit a PR!
```

### ⭐ Show Your Support

If this tool makes your life easier, give us a star! ⭐

It helps other developers discover the project and motivates us to keep improving it.

---

## 🗺️ Roadmap

### 🎯 Coming Soon

- **🍃 Ruby on Rails** support
- **⚡ WebSocket** support for real-time output streaming
- **🔌 IDE integrations** (VS Code, JetBrains)
- **🌍 Multi-instance** coordination for microservices
- **✨ Enhanced auto-completion** with IntelliSense
- **📊 Performance profiling** integration

### 💡 Ideas We're Exploring

- **🤖 AI-assisted** debugging suggestions
- **📱 Mobile app** for on-the-go debugging
- **🔗 Integration** with APM tools (DataDog, New Relic)
- **🐳 Docker** and Kubernetes native support
- **☁️ Serverless** function debugging (Lambda, Vercel)

**Have an idea?** [Open a discussion!](https://github.com/your-org/in-app-debug-console/discussions)

---

## 📄 License

MIT © [Smart Console Debugger Team](https://github.com/your-org)

---

<div align="center">

### 🎯 **Debug faster. Deploy less. Stay in control.**

**Ready to transform your debugging experience?**

[🚀 **Get Started Now**](#-quick-start) • [⭐ **Star on GitHub**](https://github.com/your-org/in-app-debug-console) • [📖 **Read the Docs**](docs/)

---

*Made with ❤️ by developers, for developers*

</div>