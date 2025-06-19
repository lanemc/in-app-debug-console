const ConsoleEngine = require('./src/node/console-engine');

console.log('🧪 Running manual tests for Node.js Console Engine...\n');

const engine = new ConsoleEngine({
  exposedGlobals: { testData: { value: 42 } }
});

async function runTests() {
  try {
    console.log('✅ Testing basic execution...');
    let result = await engine.execute('2 + 2', 'test');
    console.log('   2 + 2 =', result.value, result.success ? '✅' : '❌');
    console.log('   Type:', result.type);
    
    console.log('\n✅ Testing console.log...');
    result = await engine.execute('console.log("Hello World")', 'test');
    console.log('   Output:', JSON.stringify(result.output));
    console.log('   Success:', result.success ? '✅' : '❌');
    
    console.log('\n✅ Testing exposed globals...');
    result = await engine.execute('testData.value', 'test');
    console.log('   testData.value =', result.value, result.success ? '✅' : '❌');
    
    console.log('\n✅ Testing session persistence...');
    await engine.execute('var x = 10', 'test');
    result = await engine.execute('x + 5', 'test');
    console.log('   x + 5 =', result.value, result.success ? '✅' : '❌');
    
    console.log('\n✅ Testing error handling...');
    result = await engine.execute('invalidSyntax', 'test');
    console.log('   Error caught:', result.error ? '✅' : '❌');
    console.log('   Error message:', result.error);
    
    console.log('\n✅ Testing security (restricted require)...');
    result = await engine.execute('require("fs")', 'test');
    console.log('   Blocked fs module:', !result.success ? '✅' : '❌');
    console.log('   Error:', result.error);
    
    console.log('\n✅ Testing allowed require...');
    result = await engine.execute('require("crypto").randomBytes', 'test');
    console.log('   Allowed crypto module:', result.success ? '✅' : '❌');
    
    console.log('\n✅ Testing session stats...');
    const stats = engine.getStats();
    console.log('   Active sessions:', stats.activeSessions);
    console.log('   Session IDs:', stats.sessionIds);
    
    console.log('\n🎉 All manual tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();