# Security Guide

This document outlines security considerations, best practices, and implementation details for the In-App Debug Console.

## Security Architecture

### Defense in Depth

The console implements multiple layers of security:

1. **Authentication** - Who can access
2. **Authorization** - What they can do  
3. **Sandboxing** - Controlled execution environment
4. **Auditing** - Track all activity
5. **Rate Limiting** - Prevent abuse
6. **Network Security** - Secure transport

## Authentication & Authorization

### Required Authentication

The console **requires** explicit authentication checks:

```javascript
// Node.js - Never do this
app.use('/__console__', createConsoleMiddleware({})); // ❌ NO AUTH!

// Do this instead
app.use('/__console__', createConsoleMiddleware({
  authCheck: (req) => req.user?.role === 'admin' // ✅ AUTHENTICATED
}));
```

```python
# Python - Never do this  
app.register_blueprint(create_console_blueprint()) # ❌ NO AUTH!

# Do this instead
app.register_blueprint(create_console_blueprint(
    auth_func=lambda: current_user.role == 'admin'  # ✅ AUTHENTICATED
))
```

### Multi-Factor Authentication

Implement multiple security checks:

```javascript
function strongAuthCheck(req) {
  return req.user?.role === 'admin' &&
         req.user?.twoFactorVerified === true &&
         req.user?.permissions?.includes('debug_console') &&
         Date.now() - req.user?.lastLoginTime < 3600000; // 1 hour
}
```

### Token-Based Access

For additional security, require special tokens:

```javascript
function tokenAuthCheck(req) {
  const debugToken = req.headers['x-debug-token'];
  const validToken = process.env.DEBUG_CONSOLE_TOKEN;
  
  return req.user?.role === 'admin' && 
         debugToken === validToken &&
         validToken && validToken.length >= 32; // Strong token
}
```

## Network Security

### HTTPS Only

**Always use HTTPS in production:**

```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});
```

### IP Restrictions

Limit access by IP address:

```javascript
function ipRestrictedAuth(req) {
  const allowedIPs = process.env.ALLOWED_DEBUG_IPS?.split(',') || [];
  const clientIP = req.ip || req.connection.remoteAddress;
  
  return req.user?.role === 'admin' && 
         allowedIPs.includes(clientIP);
}
```

### VPN/Network Isolation

For maximum security:
- Only allow access from company VPN
- Use private network ranges
- Implement network-level firewalls

## Code Execution Security

### Sandboxing

#### Node.js Sandboxing
```javascript
// The console uses Node's vm module for isolation
const context = vm.createContext({
  // Limited global access
  console: safeConsoleProxy,
  require: limitedRequire, // Only safe modules
  // NO access to process.exit, fs, etc.
});
```

#### Python Sandboxing
```python
# Limited builtins and modules
safe_globals = {
    '__builtins__': {
        # Only safe built-in functions
        'print', 'len', 'str', 'int', etc.
        # NO __import__, eval, exec, open, etc.
    },
    'math': math,  # Safe modules only
    'json': json,
}
```

### Timeout Protection

Always set execution timeouts:

```javascript
// Node.js - 5 second timeout
createConsoleMiddleware({
  timeout: 5000,
  authCheck: yourAuthFunction
});
```

```python
# Python - 5 second timeout  
create_console_blueprint(
    timeout=5,
    auth_func=your_auth_function
)
```

### Output Limits

Prevent memory exhaustion:

```javascript
createConsoleMiddleware({
  maxOutputLength: 10000, // 10KB limit
  authCheck: yourAuthFunction
});
```

## Audit & Monitoring

### Comprehensive Logging

Enable detailed audit logs:

```javascript
const consoleMiddleware = createConsoleMiddleware({
  enableLogging: true, // Logs everything
  authCheck: yourAuthFunction
});

// Logs include:
// - User identification
// - Timestamp
// - Commands executed  
// - Results/errors
// - Session information
// - IP addresses
```

### Log Analysis

Monitor for suspicious activity:

```bash
# Look for failed auth attempts
grep "Unauthorized access" /var/log/app.log

# Monitor command execution
grep "Executing code" /var/log/app.log

# Check for errors
grep "Execution error" /var/log/app.log
```

### Alerting

Set up alerts for:
- Multiple failed auth attempts
- Unusual command patterns
- Long-running executions
- Large output generation

## Environment Configuration

### Development vs Production

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';
const isStaging = process.env.NODE_ENV === 'staging';

// Only enable where appropriate
if (isDevelopment || (isStaging && process.env.ENABLE_DEBUG_CONSOLE)) {
  app.use('/__console__', createConsoleMiddleware({
    authCheck: isDevelopment ? 
      () => true :                    // Relaxed in dev
      strongProductionAuthCheck,      // Strict in staging
    timeout: isDevelopment ? 30000 : 5000,
  }));
}
```

### Production Checklist

Before enabling in production:

- [ ] Strong authentication implemented
- [ ] HTTPS enforced
- [ ] IP restrictions configured
- [ ] Audit logging enabled
- [ ] Monitoring/alerting setup
- [ ] Limited exposed globals
- [ ] Short execution timeouts
- [ ] Team access controls documented
- [ ] Incident response plan ready

## Exposed Globals Security

### Safe Globals

Expose only safe, read-only operations:

```javascript
// ✅ Safe globals
exposedGlobals: {
  // Read-only data
  stats: () => ({ uptime: process.uptime() }),
  config: () => ({ env: process.env.NODE_ENV }),
  
  // Safe utility functions
  getUser: (id) => users.find(u => u.id === id),
  
  // Limited write operations with validation
  updateUserField: (id, field, value) => {
    const allowedFields = ['name', 'email'];
    if (!allowedFields.includes(field)) {
      throw new Error('Field not allowed');
    }
    return updateUser(id, field, value);
  }
}
```

### Dangerous Globals

**Never expose:**

```javascript
// ❌ NEVER expose these
exposedGlobals: {
  process: process,           // Can exit app
  require: require,           // Can require dangerous modules  
  fs: require('fs'),          // File system access
  exec: require('child_process').exec,  // Command execution
  database: rawDatabaseConnection,      // Direct DB access
  secrets: process.env,       // Environment variables
}
```

## Common Attack Vectors

### 1. Authentication Bypass

**Attack:** Accessing console without proper auth
**Prevention:** 
- Always implement authCheck function
- Test auth thoroughly
- Monitor failed attempts

### 2. Code Injection

**Attack:** Executing malicious code
**Prevention:**
- Proper sandboxing
- Limited exposed globals
- Execution timeouts

### 3. Information Disclosure

**Attack:** Accessing sensitive data
**Prevention:**
- Limit exposed globals
- Output truncation
- Audit logging

### 4. Denial of Service

**Attack:** Resource exhaustion
**Prevention:**
- Execution timeouts
- Output limits
- Rate limiting

### 5. Privilege Escalation

**Attack:** Gaining higher permissions
**Prevention:**
- Strong authentication
- Limited scope of exposed functions
- Regular security reviews

## Incident Response

### If Console is Compromised

1. **Immediately disable** console access
2. **Review audit logs** for malicious activity
3. **Check application state** for unauthorized changes
4. **Rotate credentials** that may have been exposed
5. **Investigate** how auth was bypassed
6. **Document** incident for future prevention

### Emergency Disable

Quick ways to disable console:

```javascript
// Method 1: Environment variable
if (process.env.EMERGENCY_DISABLE_CONSOLE !== 'true') {
  app.use('/__console__', consoleMiddleware);
}

// Method 2: Feature flag
if (featureFlags.debugConsole && !featureFlags.emergencyMode) {
  app.use('/__console__', consoleMiddleware);
}

// Method 3: Auth check override
function authCheck(req) {
  if (process.env.EMERGENCY_DISABLE_CONSOLE === 'true') {
    return false; // Always deny
  }
  return normalAuthCheck(req);
}
```

## Security Testing

### Test Authentication

```javascript
// Test auth bypass attempts
describe('Console Security', () => {
  it('denies access without auth', async () => {
    const response = await request(app)
      .get('/__console__')
      .expect(403);
  });
  
  it('denies access with invalid auth', async () => {
    const response = await request(app)
      .get('/__console__')
      .set('Authorization', 'Bearer invalid')
      .expect(403);
  });
});
```

### Test Code Execution

```javascript
it('prevents dangerous operations', async () => {
  const response = await request(app)
    .post('/__console__/execute')
    .set('Authorization', 'Bearer valid-admin-token')
    .send({ code: 'process.exit(1)' })
    .expect(200);
    
  expect(response.body.success).toBe(false);
  expect(response.body.error).toContain('not allowed');
});
```

## Compliance Considerations

### GDPR/Privacy

- Audit logs may contain personal data
- Implement data retention policies
- Consider log anonymization

### SOX/Financial

- Console access must be audited
- Implement segregation of duties
- Regular access reviews

### HIPAA/Healthcare

- Additional encryption requirements
- Enhanced access controls
- Data handling restrictions

## Security Updates

### Stay Updated

- Monitor for security updates
- Review audit logs regularly
- Update authentication methods
- Review exposed globals periodically

### Security Contact

Report security issues to: security@smart-console-debugger.com

---

Remember: **Security is not optional**. The console provides powerful capabilities that require careful protection.