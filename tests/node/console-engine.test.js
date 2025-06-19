const ConsoleEngine = require('../../src/node/console-engine');

describe('ConsoleEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ConsoleEngine({
      timeout: 1000,
      maxOutputLength: 1000,
      exposedGlobals: {
        testData: { value: 42 }
      }
    });
  });

  afterEach(() => {
    // Clean up sessions
    engine.sessions.clear();
  });

  describe('Basic Execution', () => {
    test('should execute simple arithmetic', async () => {
      const result = await engine.execute('2 + 2', 'test-session');
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('4');
      expect(result.type).toBe('number');
    });

    test('should execute string operations', async () => {
      const result = await engine.execute('"hello" + " world"', 'test-session');
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('"hello world"');
      expect(result.type).toBe('string');
    });

    test('should handle console.log output', async () => {
      const result = await engine.execute('console.log("test output")', 'test-session');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('test output');
    });
  });

  describe('Session Management', () => {
    test('should maintain session state', async () => {
      await engine.execute('var x = 10', 'test-session');
      const result = await engine.execute('x + 5', 'test-session');
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('15');
    });

    test('should isolate different sessions', async () => {
      await engine.execute('var sessionVar = "session1"', 'session1');
      await engine.execute('var sessionVar = "session2"', 'session2');
      
      const result1 = await engine.execute('sessionVar', 'session1');
      const result2 = await engine.execute('sessionVar', 'session2');
      
      expect(result1.value).toBe('"session1"');
      expect(result2.value).toBe('"session2"');
    });
  });

  describe('Exposed Globals', () => {
    test('should access exposed globals', async () => {
      const result = await engine.execute('testData.value', 'test-session');
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('42');
    });

    test('should be able to expose new globals', () => {
      engine.exposeGlobal('newGlobal', { test: 'value' });
      
      return engine.execute('newGlobal.test', 'test-session').then(result => {
        expect(result.success).toBe(true);
        expect(result.value).toBe('"value"');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle syntax errors', async () => {
      const result = await engine.execute('invalid syntax here', 'test-session');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle runtime errors', async () => {
      const result = await engine.execute('throw new Error("test error")', 'test-session');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('test error');
      expect(result.stack).toBeDefined();
    });

    test('should handle undefined variables', async () => {
      const result = await engine.execute('undefinedVariable', 'test-session');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('undefinedVariable');
    });
  });

  describe('Security', () => {
    test('should restrict dangerous modules', async () => {
      const result = await engine.execute('require("fs")', 'test-session');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    test('should allow safe modules', async () => {
      const result = await engine.execute('require("crypto")', 'test-session');
      
      expect(result.success).toBe(true);
    });
  });

  describe('Output Limits', () => {
    test('should truncate large output', async () => {
      engine.maxOutputLength = 10;
      const result = await engine.execute('console.log("a".repeat(20))', 'test-session');
      
      expect(result.success).toBe(true);
      expect(result.output.length).toBeLessThan(50); // Should be truncated
      expect(result.output).toContain('truncated');
    });
  });

  describe('Promises', () => {
    test('should handle resolved promises', async () => {
      const result = await engine.execute('Promise.resolve(42)', 'test-session');
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('42');
    });

    test('should handle rejected promises', async () => {
      const result = await engine.execute('Promise.reject(new Error("promise error"))', 'test-session');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('promise error');
    });
  });

  describe('Stats and Management', () => {
    test('should provide session stats', () => {
      engine.getSession('test1');
      engine.getSession('test2');
      
      const stats = engine.getStats();
      
      expect(stats.activeSessions).toBe(2);
      expect(stats.sessionIds).toContain('test1');
      expect(stats.sessionIds).toContain('test2');
    });

    test('should clear sessions', () => {
      engine.getSession('test-session');
      expect(engine.getStats().activeSessions).toBe(1);
      
      engine.clearSession('test-session');
      expect(engine.getStats().activeSessions).toBe(0);
    });
  });
});

// Mock test setup
if (typeof describe === 'undefined') {
  // Simple test runner for manual testing
  console.log('Running manual tests...');
  
  const engine = new ConsoleEngine({
    exposedGlobals: { testData: { value: 42 } }
  });
  
  async function runTests() {
    try {
      console.log('Testing basic execution...');
      let result = await engine.execute('2 + 2', 'test');
      console.log('2 + 2 =', result.value, result.success ? '✅' : '❌');
      
      console.log('Testing console.log...');
      result = await engine.execute('console.log("Hello World")', 'test');
      console.log('Output:', result.output, result.success ? '✅' : '❌');
      
      console.log('Testing exposed globals...');
      result = await engine.execute('testData.value', 'test');
      console.log('testData.value =', result.value, result.success ? '✅' : '❌');
      
      console.log('Testing error handling...');
      result = await engine.execute('invalidSyntax', 'test');
      console.log('Error:', result.error, !result.success ? '✅' : '❌');
      
      console.log('All manual tests completed!');
    } catch (error) {
      console.error('Test failed:', error);
    }
  }
  
  runTests();
}