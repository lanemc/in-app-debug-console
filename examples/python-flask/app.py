#!/usr/bin/env python3
"""
Debug Console Demo App (Python/Flask)

Example Flask application demonstrating the In-App Debug Console integration.
"""

import os
import time
from datetime import datetime
from flask import Flask, request, jsonify, session, g
from werkzeug.exceptions import Unauthorized, NotFound

# Add parent directories to path to import our console
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'python'))

from in_app_debug_console import create_console_blueprint

app = Flask(__name__)
app.secret_key = 'debug-console-demo-secret'

# Sample application state
app_data = {
    'users': [
        {'id': 1, 'name': 'Alice', 'role': 'admin'},
        {'id': 2, 'name': 'Bob', 'role': 'user'},  
        {'id': 3, 'name': 'Charlie', 'role': 'user'}
    ],
    'stats': {
        'requests': 0,
        'uptime': time.time()
    },
    'cache': {}
}

# Simple auth for demo
@app.before_request
def authenticate():
    """Simple authentication for demo purposes"""
    # Simulate user authentication
    auth_header = request.headers.get('Authorization')
    if auth_header == 'Bearer admin-token':
        g.user = {'id': 1, 'name': 'Admin', 'role': 'admin'}
        session['user'] = g.user
    elif 'user' in session:
        g.user = session['user']
    else:
        g.user = None
    
    # Track requests
    app_data['stats']['requests'] += 1

# Routes
@app.route('/')
def index():
    """Main endpoint with app info"""
    return jsonify({
        'message': 'Debug Console Demo App (Python/Flask)',
        'user': getattr(g, 'user', None),
        'stats': {
            **app_data['stats'],
            'uptime': time.time() - app_data['stats']['uptime']
        },
        'instructions': {
            'login': 'Send "Authorization: Bearer admin-token" header to login as admin',
            'console': 'Visit /__console__ to access debug console (admin only)',
            'routes': ['/users', '/stats', '/cache']
        }
    })

@app.route('/users')
def get_users():
    """Get all users"""
    return jsonify(app_data['users'])

@app.route('/stats')
def get_stats():
    """Get app statistics"""
    return jsonify({
        **app_data['stats'],
        'uptime': time.time() - app_data['stats']['uptime'],
        'current_time': datetime.now().isoformat()
    })

@app.route('/cache')
def get_cache():
    """Get cache contents"""
    return jsonify(app_data['cache'])

@app.route('/cache/<key>', methods=['POST'])
def set_cache(key):
    """Set cache value"""
    data = request.get_json() or {}
    value = data.get('value')
    app_data['cache'][key] = value
    return jsonify({'message': f'Cached {key}', 'value': value})

# Utility functions to expose in console
def get_user(user_id):
    """Get user by ID"""
    return next((u for u in app_data['users'] if u['id'] == user_id), None)

def add_user(name, role='user'):
    """Add a new user"""
    user = {
        'id': int(time.time()),
        'name': name,
        'role': role
    }
    app_data['users'].append(user)
    return user

def clear_cache():
    """Clear all cache"""
    app_data['cache'].clear()
    return 'Cache cleared'

def get_uptime():
    """Get app uptime in seconds"""
    return time.time() - app_data['stats']['uptime']

# Console auth check
def console_auth_check():
    """Check if current user can access console"""
    user = getattr(g, 'user', None)
    return user and user.get('role') == 'admin'

# Create and register console blueprint
console_bp = create_console_blueprint(
    auth_func=console_auth_check,
    url_prefix='/__console__',
    exposed_globals={
        # Expose app data
        'app_data': app_data,
        'users': app_data['users'],
        'stats': app_data['stats'],
        'cache': app_data['cache'],
        
        # Expose Flask objects
        'app': app,
        'request': request,
        'session': session,
        'g': g,
        
        # Utility functions
        'get_user': get_user,
        'add_user': add_user,
        'clear_cache': clear_cache,
        'get_uptime': get_uptime,
        
        # Common modules
        'datetime': datetime,
        'time': time,
        'os': os
    }
)

app.register_blueprint(console_bp)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"\\n🚀 Debug Console Demo App running on port {port}")
    print(f"\\n📊 Available endpoints:")
    print(f"   GET  / - App info and instructions")
    print(f"   GET  /users - List users")
    print(f"   GET  /stats - App statistics")  
    print(f"   GET  /cache - View cache contents")
    print(f"   POST /cache/<key> - Set cache value")
    print(f"\\n🐛 Debug Console:")
    print(f"   GET  /__console__ - Debug console (admin only)")
    print(f"\\n🔑 To access console:")
    print(f"   1. Send request with header: Authorization: Bearer admin-token")
    print(f"   2. Visit http://localhost:{port}/__console__")
    print(f"\\n💡 Try these commands in the console:")
    print(f"   app_data['users']")
    print(f"   get_user(1)")
    print(f"   add_user('Test User', 'admin')")
    print(f"   stats['requests']")
    print(f"   clear_cache()")
    print(f"   print('Hello from debug console!')")
    print(f"   datetime.now()")
    
    app.run(host='0.0.0.0', port=port, debug=debug)