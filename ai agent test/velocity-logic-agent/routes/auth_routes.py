"""
Authentication API Routes
Handles login, signup, and user management.
"""

from flask import Blueprint, request, jsonify
from database.db_manager import DatabaseManager
from database.auth_service import AuthService

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
db = DatabaseManager()


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Create a new client and owner user."""
    data = request.json
    
    # Validate required fields
    required = ['company_name', 'email', 'password']
    if not all(field in data for field in required):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Validate password strength
    is_valid, error_msg = AuthService.validate_password_strength(data['password'])
    if not is_valid:
        return jsonify({"error": error_msg}), 400
    
    # Check if email already exists
    existing_user = db.get_user_by_email(data['email'])
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400
    
    try:
        # Create client
        client_id = db.create_client(
            company_name=data['company_name'],
            industry=data.get('industry'),
            subscription_tier='free'
        )
        
        # Hash password
        password_hash = AuthService.hash_password(data['password'])
        
        # Create owner user
        user_id = db.create_user(
            client_id=client_id,
            email=data['email'],
            password_hash=password_hash,
            full_name=data.get('full_name'),
            role='owner'
        )
        
        # Generate token
        token = AuthService.generate_token(user_id, client_id, 'owner')
        
        return jsonify({
            "success": True,
            "message": "Account created successfully",
            "token": token,
            "user": {
                "id": user_id,
                "email": data['email'],
                "role": "owner"
            },
            "client": {
                "id": client_id,
                "company_name": data['company_name']
            }
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user and return JWT token."""
    data = request.json
    
    # Validate required fields
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password required"}), 400
    
    try:
        # Get user by email
        user = db.get_user_by_email(data['email'])
        
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Verify password
        if not AuthService.verify_password(data['password'], user['password_hash']):
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Get client info
        client = db.get_client(user['client_id'])
        
        if not client or not client.get('is_active'):
            return jsonify({"error": "Account is not active"}), 403
        
        # Update last login
        db.update_last_login(user['id'])
        
        # Generate token
        token = AuthService.generate_token(user['id'], user['client_id'], user['role'])
        
        return jsonify({
            "success": True,
            "token": token,
            "user": {
                "id": user['id'],
                "email": user['email'],
                "full_name": user['full_name'],
                "role": user['role']
            },
            "client": {
                "id": client['id'],
                "company_name": client['company_name'],
                "industry": client['industry']
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current user info from token."""
    # Get token from header
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401
    
    token = auth_header.replace('Bearer ', '')
    
    # Verify token
    payload = AuthService.verify_token(token)
    
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401
    
    # Get user and client info
    user = db.get_user(payload['user_id'])
    client = db.get_client(payload['client_id'])
    
    if not user or not client:
        return jsonify({"error": "User or client not found"}), 404
    
    return jsonify({
        "user": {
            "id": user['id'],
            "email": user['email'],
            "full_name": user['full_name'],
            "role": user['role'],
            "last_login": user['last_login']
        },
        "client": {
            "id": client['id'],
            "company_name": client['company_name'],
            "industry": client['industry'],
            "subscription_tier": client['subscription_tier']
        }
    })


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout (client-side only - just remove token)."""
    # JWT is stateless, so logout just tells client to delete token
    return jsonify({"success": True, "message": "Logged out successfully"})
