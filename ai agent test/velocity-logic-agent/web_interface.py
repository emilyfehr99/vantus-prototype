"""
Velocity Logic - Web Interface (Multi-Tenant)
Flask API for multi-tenant quoting system with authentication.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from datetime import datetime
from main import VelocityLogicAgent
from services.polling_service import PollingService
from database.db_manager import DatabaseManager
from database.auth_service import AuthService
from middleware.auth_middleware import require_auth
from routes.auth_routes import auth_bp

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'output'

# Initialize services
db = DatabaseManager()
auth_service = AuthService()
agent = None
polling_service = PollingService(check_interval=60)

def init_agent():
    """Initialize the agent."""
    global agent
    try:
        agent = VelocityLogicAgent()
        print("✓ Agent initialized for web interface")
    except Exception as e:
        print(f"✗ Error initializing agent: {e}")
        agent = None

# Initialize agent and register routes
init_agent()
app.register_blueprint(auth_bp)

from routes.analytics_routes import analytics_bp
app.register_blueprint(analytics_bp)

# ============================================
# Helper Functions  
# ============================================

def get_company_info(client_id: str) -> dict:
    """Get company branding info for a client."""
    settings = db.get_client_settings(client_id)
    client = db.get_client(client_id)
    
    if not settings or not client:
        return {}
    
    return {
        'company_name': client.get('company_name', 'Your Company'),
        'company_tagline': settings.get('company_tagline', ''),
        'company_address': settings.get('company_address', ''),
        'company_phone': settings.get('company_phone', ''),
        'company_email': settings.get('company_email', ''),
        'company_website': settings.get('company_website', ''),
        'logo_path': settings.get('logo_path', ''),
        'primary_color': settings.get('primary_color', '#2563eb'),
        'secondary_color': settings.get('secondary_color', '#10b981')
    }

# ============================================
# Public Endpoints
# ============================================

@app.route('/')
def index():
    """API root."""
    return jsonify({
        "message": "Velocity Logic API v2.0",
        "endpoints": {
            "auth": "/api/auth/*",
            "drafts": "/api/drafts",
            "status": "/api/status"
        }
    })

@app.route('/api/status')
def get_status():
    """Get agent status (public)."""
    return jsonify({
        "running": agent is not None,
        "polling_active": polling_service.is_running,
        "version": "2.0-multitenant"
    })

# ============================================
# Draft Endpoints (Protected)
# ============================================

@app.route('/api/drafts', methods=['GET'])
@require_auth
def get_drafts():
    """Get all drafts for authenticated client."""
    status_filter = request.args.get('status')
    drafts = db.get_drafts(request.client_id, status=status_filter)
    return jsonify(drafts)

@app.route('/api/drafts/<draft_id>', methods=['GET'])
@require_auth
def get_draft(draft_id):
    """Get a specific draft."""
    drafts = db.get_drafts(request.client_id)
    draft = next((d for d in drafts if d['id'] == draft_id), None)
    
    if not draft:
        return jsonify({"error": "Draft not found"}), 404
    
    return jsonify(draft)

@app.route('/api/drafts/<draft_id>', methods=['PUT'])
@require_auth
def update_draft(draft_id):
    """Update a draft."""
    # Verify ownership
    drafts = db.get_drafts(request.client_id)
    draft = next((d for d in drafts if d['id'] == draft_id), None)
    
    if not draft:
        return jsonify({"error": "Draft not found"}), 404
    
    data = request.json
    
    # Update status if provided
    if 'status' in data:
        db.update_draft_status(draft_id, data['status'], request.user_id)
    
    db.log_activity(request.client_id, "Draft Updated", f"Draft {draft_id} updated", request.user_id)
    
    return jsonify({"success": True})

@app.route('/api/drafts/<draft_id>/approve', methods=['POST'])
@require_auth
def approve_draft(draft_id):
    """Approve and send a draft."""
    # Verify ownership
    drafts = db.get_drafts(request.client_id)
    draft = next((d for d in drafts if d['id'] == draft_id), None)
    
    if not draft:
        return jsonify({"error": "Draft not found"}), 404
    
    try:
        # Update status
        db.update_draft_status(draft_id, 'APPROVED', request.user_id)
        
        # Send email (if Gmail is configured)
        if agent and agent.gmail_service:
            # Implementation for sending would go here
            pass
        
        db.log_activity(request.client_id, "Draft Approved", f"Quote #{draft['quote_number']} approved", request.user_id)
        
        return jsonify({"success": True, "message": "Draft approved"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/drafts/<draft_id>/reject', methods=['POST'])
@require_auth
def reject_draft(draft_id):
    """Reject a draft."""
    # Verify ownership
    drafts = db.get_drafts(request.client_id)
    draft = next((d for d in drafts if d['id'] == draft_id), None)
    
    if not draft:
        return jsonify({"error": "Draft not found"}), 404
    
    db.update_draft_status(draft_id, 'REJECTED', request.user_id)
    db.log_activity(request.client_id, "Draft Rejected", f"Quote #{draft['quote_number']} rejected", request.user_id)
    
    return jsonify({"success": True, "message": "Draft rejected"})

# ============================================
# Email Processing (Protected)
# ============================================

@app.route('/api/process-email', methods=['POST'])
@require_auth
def process_email():
    """Process an email and create a draft quote."""
    if agent is None:
        return jsonify({"error": "Agent not initialized"}), 500
    
    data = request.json
    
    if not data or 'email_body' not in data:
        return jsonify({"error": "Missing email_body"}), 400
    
    try:
        customer_email = data.get('customer_email', 'unknown@example.com')
        email_body = data.get('email_body', '')
        
        # Get company settings
        company_info = get_company_info(request.client_id)
        
        # Process the email
        result = agent.process_email(email_body, customer_email, company_info=company_info)
        
        if result:
            # Create draft in database
            draft_data = {
                'id': result['quote_number'],
                'quote_number': result['quote_number'],
                'customer_name': result['customer_name'],
                'customer_email': customer_email,
                'total': result['total'],
                'pdf_url': f"/api/pdf/{os.path.basename(result['pdf_path'])}",
                'status': 'PENDING_APPROVAL',
                'confidence': result.get('confidence', 50),
                'created_by': request.user_id
            }
            
            line_items = result.get('line_items', [])
            
            # Save to database
            db.create_draft(request.client_id, draft_data, line_items)
            
            # Create or update customer
            db.get_or_create_customer(request.client_id, customer_email, result['customer_name'])
            
            # Log activity
            db.log_activity(request.client_id, "Draft Created", f"Quote #{result['quote_number']} for {result['customer_name']}", request.user_id)
            
            return jsonify({
                "success": True,
                "message": "Draft created successfully",
                "draft": draft_data
            })
        else:
            return jsonify({"error": "Failed to process email"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# Settings Endpoints (Protected)
# ============================================

@app.route('/api/settings', methods=['GET'])
@require_auth
def get_settings():
    """Get client settings."""
    settings = db.get_client_settings(request.client_id)
    client = db.get_client(request.client_id)
    
    if not settings or not client:
        return jsonify({"error": "Settings not found"}), 404
    
    return jsonify({
        'company_name': client.get('company_name'),
        'company_tagline': settings.get('company_tagline'),
        'company_address': settings.get('company_address'),
        'company_phone': settings.get('company_phone'),
        'company_email': settings.get('company_email'),
        'company_website': settings.get('company_website'),
        'logo_path': settings.get('logo_path'),
        'primary_color': settings.get('primary_color'),
        'secondary_color': settings.get('secondary_color'),
        'pricing_csv_path': settings.get('pricing_csv_path'),
        'tax_rate': settings.get('tax_rate'),
        'auto_approve_threshold': settings.get('auto_approve_threshold')
    })

@app.route('/api/settings', methods=['POST'])
@require_auth
def update_settings():
    """Update client settings."""
    data = request.json
    
    try:
        # Update settings
        db.update_client_settings(request.client_id, data)
        
        # If company_name changed, update client table
        if 'company_name' in data:
            conn = db.get_connection()
            conn.execute("UPDATE clients SET company_name = ? WHERE id = ?", 
                        (data['company_name'], request.client_id))
            conn.commit()
            conn.close()
        
        db.log_activity(request.client_id, "Settings Updated", "Company settings modified", request.user_id)
        
        return jsonify({"success": True, "message": "Settings updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings/logo', methods=['POST'])
@require_auth
def upload_logo():
    """Upload company logo."""
    if 'logo' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['logo']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.svg')):
        # Create client-specific uploads directory
        upload_dir = os.path.join('uploads', request.client_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        filename = f"logo_{int(datetime.now().timestamp())}.{file.filename.rsplit('.', 1)[1].lower()}"
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        
        # Update settings
        db.update_client_settings(request.client_id, {'logo_path': filepath})
        
        db.log_activity(request.client_id, "Logo Updated", "Company logo uploaded", request.user_id)
        
        return jsonify({"success": True, "logo_path": filepath})
    
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/settings/pricing', methods=['POST'])
@require_auth
def upload_pricing():
    """Upload pricing CSV."""
    if 'pricing' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['pricing']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and file.filename.lower().endswith('.csv'):
        # Create client-specific data directory
        data_dir = os.path.join('data', request.client_id)
        os.makedirs(data_dir, exist_ok=True)
        
        # Save file
        filepath = os.path.join(data_dir, 'pricing.csv')
        file.save(filepath)
        
        # Update settings
        db.update_client_settings(request.client_id, {'pricing_csv_path': filepath})
        
        # Reload agent's pricing engine
        try:
            global agent
            if agent:
                agent.pricing_engine.load_pricing_data(filepath)
        except Exception as e:
            print(f"Error reloading pricing: {e}")
        
        db.log_activity(request.client_id, "Pricing Updated", "Pricing CSV uploaded", request.user_id)
        
        return jsonify({"success": True, "message": "Pricing data updated"})
    
    return jsonify({"error": "Invalid file type"}), 400

# ============================================
# Activity Log (Protected)
# ============================================

@app.route('/api/activity', methods=['GET'])
@require_auth
def get_activity():
    """Get recent activity for client."""
    limit = int(request.args.get('limit', 50))
    activity = db.get_activity_log(request.client_id, limit=limit)
    return jsonify(activity)

# ============================================
# PDF Serving
# ============================================

@app.route('/api/pdf/<filename>')
@require_auth
def serve_pdf(filename):
    """Serve a PDF file."""
    pdf_path = os.path.join('output', filename)
    
    if os.path.exists(pdf_path):
        return send_file(pdf_path, mimetype='application/pdf')
    
    return jsonify({"error": "File not found"}), 404

# ============================================
# Polling Endpoints (Protected)
# ============================================

@app.route('/api/polling/status', methods=['GET'])
@require_auth
def get_polling_status():
    """Get polling status."""
    status = polling_service.get_status()
    return jsonify(status)

@app.route('/api/polling/start', methods=['POST'])
@require_auth
def start_polling():
    """Start email polling."""
    global agent
    
    if not agent:
        return jsonify({"error": "Agent not initialized"}), 500
    
    if polling_service.is_running:
        return jsonify({"error": "Polling already running"}), 400
    
    try:
        polling_service.start(
            gmail_service=agent.gmail_service,
            agent=agent,
            process_callback=lambda result: db.log_activity(
                request.client_id,
                "Draft Created (Auto)",
                f"Quote #{result['quote_number']} for {result['customer_name']}",
                None
            )
        )
        
        return jsonify({
            "success": True,
            "message": f"Polling started (every {polling_service.check_interval}s)"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/polling/stop', methods=['POST'])
@require_auth
def stop_polling():
    """Stop email polling."""
    if not polling_service.is_running:
        return jsonify({"error": "Polling not running"}), 400
    
    try:
        polling_service.stop()
        return jsonify({"success": True, "message": "Polling stopped"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# Server Startup
# ============================================

if __name__ == '__main__':
    print("=" * 60)
    print("🌐 Velocity Logic Web Interface v2.0 (Multi-Tenant)")
    print("=" * 60)
    print("📱 Frontend: http://localhost:5002")
    print("🔐 Default Login: demo@velocitylogic.com / changeme123")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5001)
