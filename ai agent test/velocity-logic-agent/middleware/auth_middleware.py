"""
Authentication middleware for protecting routes.
"""

from flask import request, jsonify
from functools import wraps
from database.auth_service import AuthService


def require_auth(f):
    """
    Decorator to require JWT authentication for a route.
    Extracts user_id and client_id from token and adds to request object.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        
        token = auth_header.replace('Bearer ', '')
        
        # Verify token
        payload = AuthService.verify_token(token)
        
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Add user info to request context
        request.user_id = payload['user_id']
        request.client_id = payload['client_id']
        request.user_role = payload['role']
        
        return f(*args, **kwargs)
    
    return decorated_function
