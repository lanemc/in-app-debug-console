import code
import sys
import io
import traceback
import signal
import threading
import time
from contextlib import redirect_stdout, redirect_stderr
from typing import Dict, Any, Optional, Callable


class TimeoutError(Exception):
    """Raised when code execution times out"""
    pass


class ConsoleEngine:
    """Core execution engine for Python debug console"""
    
    def __init__(self, timeout: int = 5, max_output_length: int = 10000, 
                 exposed_globals: Optional[Dict[str, Any]] = None):
        self.timeout = timeout
        self.max_output_length = max_output_length
        self.sessions: Dict[str, code.InteractiveConsole] = {}
        self.exposed_globals = exposed_globals or {}
        
    def get_session(self, session_id: str) -> code.InteractiveConsole:
        """Get or create a console session"""
        if session_id not in self.sessions:
            # Create safe globals dict
            safe_globals = self._create_safe_globals()
            safe_globals.update(self.exposed_globals)
            
            # Create InteractiveConsole with safe globals
            console = code.InteractiveConsole(locals=safe_globals)
            self.sessions[session_id] = console
            
        return self.sessions[session_id]
    
    def execute(self, code_string: str, session_id: str) -> Dict[str, Any]:
        """Execute code in a session context"""
        console = self.get_session(session_id)
        
        # Capture output
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        # Store original exception handler
        original_excepthook = sys.excepthook
        exception_info = {}
        
        def exception_handler(exc_type, exc_value, exc_traceback):
            exception_info['type'] = exc_type.__name__
            exception_info['value'] = str(exc_value)
            exception_info['traceback'] = ''.join(
                traceback.format_exception(exc_type, exc_value, exc_traceback)
            )
        
        try:
            # Set up timeout if supported (Unix-like systems)
            if hasattr(signal, 'SIGALRM'):
                def timeout_handler(signum, frame):
                    raise TimeoutError(f"Code execution timed out after {self.timeout} seconds")
                
                signal.signal(signal.SIGALRM, timeout_handler)
                signal.alarm(self.timeout)
            
            # Redirect output and execute code
            sys.excepthook = exception_handler
            
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                # Check if code is complete
                try:
                    compile(code_string, '<string>', 'exec')
                except SyntaxError as e:
                    if 'unexpected EOF' in str(e):
                        return {
                            'success': False,
                            'error': 'Incomplete code - multi-line input not fully supported in this version',
                            'output': '',
                            'needs_more': True
                        }
                
                # Execute the code
                more_needed = console.push(code_string)
                
                if more_needed:
                    return {
                        'success': True,
                        'output': '... (continuation expected)',
                        'needs_more': True
                    }
            
            # Get captured output
            stdout_content = stdout_capture.getvalue()
            stderr_content = stderr_capture.getvalue()
            combined_output = stdout_content + stderr_content
            
            # Check for exceptions
            if exception_info:
                return {
                    'success': False,
                    'error': exception_info.get('value', 'Unknown error'),
                    'traceback': exception_info.get('traceback', ''),
                    'output': self._truncate_output(combined_output)
                }
            
            return {
                'success': True,
                'output': self._truncate_output(combined_output),
                'needs_more': False
            }
            
        except TimeoutError as e:
            return {
                'success': False,
                'error': str(e),
                'output': self._truncate_output(stdout_capture.getvalue() + stderr_capture.getvalue())
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc(),
                'output': self._truncate_output(stdout_capture.getvalue() + stderr_capture.getvalue())
            }
        finally:
            # Restore original exception handler
            sys.excepthook = original_excepthook
            
            # Cancel timeout if it was set
            if hasattr(signal, 'SIGALRM'):
                signal.alarm(0)
    
    def _create_safe_globals(self) -> Dict[str, Any]:
        """Create a dictionary of safe global variables for the console"""
        import builtins
        import math
        import json
        import datetime
        import re
        
        # Start with safe builtins
        safe_builtins = {
            'abs', 'all', 'any', 'bin', 'bool', 'chr', 'dict', 'dir', 'divmod',
            'enumerate', 'filter', 'float', 'format', 'frozenset', 'getattr',
            'hasattr', 'hash', 'hex', 'id', 'int', 'isinstance', 'issubclass',
            'iter', 'len', 'list', 'map', 'max', 'min', 'oct', 'ord', 'pow',
            'print', 'range', 'repr', 'reversed', 'round', 'set', 'slice',
            'sorted', 'str', 'sum', 'tuple', 'type', 'vars', 'zip'
        }
        
        # Create safe globals dict
        safe_globals = {
            '__builtins__': {name: getattr(builtins, name) for name in safe_builtins},
            'math': math,
            'json': json,
            'datetime': datetime,
            're': re,
        }
        
        return safe_globals
    
    def _truncate_output(self, output: str) -> str:
        """Truncate output if it's too long"""
        if len(output) > self.max_output_length:
            return (output[:self.max_output_length] + 
                   f"\n... (output truncated, {len(output) - self.max_output_length} characters omitted)")
        return output
    
    def clear_session(self, session_id: str) -> None:
        """Clear a console session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get session statistics"""
        return {
            'active_sessions': len(self.sessions),
            'session_ids': list(self.sessions.keys())
        }
    
    def expose_global(self, name: str, value: Any) -> None:
        """Expose a global variable/object to all sessions"""
        self.exposed_globals[name] = value
        
        # Update existing sessions
        for console in self.sessions.values():
            console.locals[name] = value
    
    def evaluate_expression(self, expression: str, session_id: str) -> Dict[str, Any]:
        """Evaluate a single expression and return its value"""
        console = self.get_session(session_id)
        
        try:
            # Compile as eval to get the result
            compiled = compile(expression, '<expression>', 'eval')
            result = eval(compiled, console.locals)
            
            return {
                'success': True,
                'value': self._format_value(result),
                'type': type(result).__name__
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def _format_value(self, value: Any) -> str:
        """Format a value for display"""
        if value is None:
            return 'None'
        elif isinstance(value, str):
            return repr(value)
        elif callable(value):
            return f"<function {getattr(value, '__name__', 'anonymous')}>"
        else:
            try:
                return str(value)
            except Exception:
                return f"<{type(value).__name__} object>"