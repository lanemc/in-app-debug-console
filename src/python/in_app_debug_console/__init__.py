"""
In-App Debug Console for Python/Flask Applications

A secure, built-in mini REPL console for web applications that enables 
developers to inspect server state and execute debug commands on a running app.
"""

from .console_engine import ConsoleEngine
from .flask_integration import ConsoleBlueprint, create_console_blueprint

__version__ = "1.0.0"
__all__ = ["ConsoleEngine", "ConsoleBlueprint", "create_console_blueprint"]