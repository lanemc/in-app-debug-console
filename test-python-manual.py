#!/usr/bin/env python3
"""
Manual test for Python Console Engine
"""

import sys
import os

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'python'))

# Import the console engine directly to avoid Flask dependency
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'python', 'in_app_debug_console'))
from console_engine import ConsoleEngine

def main():
    print("🧪 Running manual tests for Python Console Engine...\n")
    
    engine = ConsoleEngine(
        timeout=5,
        max_output_length=1000,
        exposed_globals={'test_data': {'value': 42}}
    )
    
    try:
        print("✅ Testing basic execution...")
        result = engine.execute('2 + 2', 'test-session')
        print(f"   2 + 2 = {result.get('output', 'No output')}")
        print(f"   Success: {'✅' if result['success'] else '❌'}")
        
        print("\n✅ Testing print output...")
        result = engine.execute('print("Hello World")', 'test-session')
        print(f"   Output: {repr(result.get('output', ''))}")
        print(f"   Success: {'✅' if result['success'] else '❌'}")
        
        print("\n✅ Testing exposed globals...")
        result = engine.execute('test_data["value"]', 'test-session')
        print(f"   test_data['value'] = {result.get('output', 'No output')}")
        print(f"   Success: {'✅' if result['success'] else '❌'}")
        
        print("\n✅ Testing session persistence...")
        engine.execute('x = 10', 'test-session')
        result = engine.execute('x + 5', 'test-session')
        print(f"   x + 5 = {result.get('output', 'No output')}")
        print(f"   Success: {'✅' if result['success'] else '❌'}")
        
        print("\n✅ Testing error handling...")
        result = engine.execute('invalid_syntax', 'test-session')
        print(f"   Error caught: {'✅' if not result['success'] else '❌'}")
        print(f"   Error message: {result.get('error', 'No error')}")
        
        print("\n✅ Testing expression evaluation...")
        result = engine.evaluate_expression('len("hello")', 'test-session')
        print(f"   len('hello') = {result.get('value', 'No value')}")
        print(f"   Success: {'✅' if result['success'] else '❌'}")
        
        print("\n✅ Testing session stats...")
        stats = engine.get_stats()
        print(f"   Active sessions: {stats['active_sessions']}")
        print(f"   Session IDs: {stats['session_ids']}")
        
        print("\n✅ Testing global exposure...")
        engine.expose_global('new_global', {'test': 'value'})
        result = engine.execute('new_global["test"]', 'test-session')
        print(f"   new_global['test'] = {result.get('output', 'No output')}")
        
        print("\n🎉 All manual tests completed successfully!")
        
    except Exception as error:
        print(f"❌ Test failed: {error}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()