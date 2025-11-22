"""
Authentication Service for Multi-Tenant System
Handles JWT token generation, password hashing, and user authentication.
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os


class AuthService:
    """Manages authentication and authorization."""
    
    # Secret key for JWT (should be in environment variables in production)
    JWT_SECRET = os.getenv('JWT_SECRET', 'velocity-logic-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION_HOURS = 24 * 7  # 7 days
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.checkpw(
            password.encode('utf-8'),
            password_hash.encode('utf-8')
        )
    
    @staticmethod
    def generate_token(user_id: str, client_id: str, role: str) -> str:
        """Generate a JWT token for a user."""
        payload = {
            'user_id': user_id,
            'client_id': client_id,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=AuthService.JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, AuthService.JWT_SECRET, algorithm=AuthService.JWT_ALGORITHM)
        return token
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token."""
        try:
            payload = jwt.decode(
                token,
                AuthService.JWT_SECRET,
                algorithms=[AuthService.JWT_ALGORITHM]
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None  # Token expired
        except jwt.InvalidTokenError:
            return None  # Invalid token
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """
        Validate password strength.
        
        Returns:
            (is_valid, error_message)
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters"
        
        if not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
        
        if not any(c.isdigit() for c in password):
            return False, "Password must contain at least one number"
        
        return True, ""
