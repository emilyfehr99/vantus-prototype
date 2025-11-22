"""
Velocity Logic - Web Interface
Simple Flask web interface for the Velocity Logic agent.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
from datetime import datetime
from main import VelocityLogicAgent
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = 'output'

# Initialize agent
agent = None
agent_status = {
    "running": False,
    "last_check": None,
    "processed_count": 0,
    "errors": []
}

def init_agent():
    """Initialize the agent in a separate thread."""
    global agent
    try:
        agent = VelocityLogicAgent()
        print("✓ Agent initialized for web interface")
    except Exception as e:
        print(f"✗ Error initializing agent: {e}")
        agent = None

# Initialize agent on startup
# Initialize agent on startup
init_agent()

# Store drafts in a JSON file for persistence
DRAFTS_FILE = 'drafts.json'
SETTINGS_FILE = 'settings.json'

# In-memory activity log (could be persisted later)
activity_log = []

def log_activity(action: str, details: str):
    """Log an activity event."""
    event = {
        "id": len(activity_log) + 1,
        "action": action,
        "details": details,
        "timestamp": datetime.now().isoformat()
    }
    activity_log.insert(0, event) # Prepend to keep newest first
    # Keep only last 50 events
    if len(activity_log) > 50:
        activity_log.pop()

DEFAULT_SETTINGS = {
    "company_name": "Velocity Logic",
    "tagline": "HVAC Solutions & Service",
    "address": "123 Tech Blvd, San Francisco, CA",
    "phone": "(555) 123-4567",
    "email": "support@velocitylogic.com",
    "website": "www.velocitylogic.com",
    "primary_color": "#0f172a",
    "secondary_color": "#2dd4bf"
}

def load_drafts():
    """Load drafts from JSON file."""
    if os.path.exists(DRAFTS_FILE):
        try:
            with open(DRAFTS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_drafts(drafts):
    """Save drafts to JSON file."""
    with open(DRAFTS_FILE, 'w') as f:
        json.dump(drafts, f, indent=2)

def load_settings():
    """Load settings from JSON file."""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                return {**DEFAULT_SETTINGS, **json.load(f)}
        except:
            return DEFAULT_SETTINGS
    return DEFAULT_SETTINGS

def save_settings(settings):
    """Save settings to JSON file."""
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)

@app.route('/')
def index():
    """API Root."""
    return jsonify({"message": "Velocity Logic API is running. Use the frontend to interact."})

@app.route('/api/status')
def get_status():
    """Get agent status."""
    drafts = load_drafts()
    pending_count = len([d for d in drafts if d['status'] == 'PENDING_APPROVAL'])
    return jsonify({
        "agent_ready": agent is not None,
        "processed_count": agent_status["processed_count"],
        "last_check": agent_status["last_check"],
        "pending_count": pending_count
    })

@app.route('/api/process-email', methods=['POST'])
def process_email():
    """Process an email and create a draft quote."""
    if agent is None:
        return jsonify({
            "success": False,
            "error": "Agent not initialized. Please check server logs."
        }), 500
    
    try:
        data = request.json
        customer_name = data.get('customer_name', 'Customer')
        customer_email = data.get('customer_email', 'customer@example.com')
        email_body = data.get('email_body', '')
        
        # Load company settings
        settings = load_settings()
        
        # Process the email
        result = agent.process_email(email_body, customer_email, company_info=settings)
        
        if result:
            # Create draft record
            draft = {
                "id": result['quote_number'],
                "quote_number": result['quote_number'],
                "customer_name": result['customer_name'],
                "customer_email": customer_email,
                "total": result['total'],
                "pdf_url": f"/api/pdf/{os.path.basename(result['pdf_path'])}",
                "created_at": datetime.now().isoformat(),
                "status": "PENDING_APPROVAL",
                "line_items": result['line_items']
            }
            
            drafts = load_drafts()
            drafts.append(draft)
            save_drafts(drafts)
            
            log_activity("Draft Created", f"Quote #{result['quote_number']} for {result['customer_name']}")
            
            return jsonify({
                "success": True,
                "message": "Draft created successfully",
                "draft": draft
            })
        
        return jsonify({
            "success": False,
            "error": "Failed to process email"
        }), 500
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/drafts')
def get_drafts():
    """Get all drafts."""
    drafts = load_drafts()
    # Sort by date desc
    drafts.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return jsonify({"drafts": drafts})

@app.route('/api/activity', methods=['GET'])
def get_activity():
    """Get recent activity log."""
    return jsonify({"activities": activity_log})

@app.route('/api/drafts/<draft_id>/approve', methods=['POST'])
def approve_draft(draft_id):
    """Approve and send a draft."""
    """Approve a draft and mark as sent."""
    drafts = load_drafts()
    for draft in drafts:
        if draft['id'] == draft_id:
            draft['status'] = 'SENT'
            draft['sent_at'] = datetime.now().isoformat()
            save_drafts(drafts)
            
            # TODO: Actually send the email via GmailService
            # agent.approve_quote(draft)
            
            log_activity("Quote Approved", f"Sent Quote #{draft['quote_number']} to {draft['customer_name']}")
            return jsonify({"success": True, "draft": draft})
            
    return jsonify({"success": False, "error": "Draft not found"}), 404

@app.route('/api/drafts/<draft_id>', methods=['PUT'])
def update_draft(draft_id):
    """Update a draft's details."""
    try:
        data = request.json
        drafts = load_drafts()
        for draft in drafts:
            if draft['id'] == draft_id:
                # Update allowed fields
                if 'line_items' in data:
                    draft['line_items'] = data['line_items']
                if 'total' in data:
                    draft['total'] = data['total']
                if 'customer_name' in data:
                    draft['customer_name'] = data['customer_name']
                
                # Regenerate PDF (optional, but good practice if line items changed)
                # For now, we'll just save the data. In a real app, we'd regenerate the PDF here.
                
                save_drafts(drafts)
                log_activity("Draft Updated", f"Updated Quote #{draft['quote_number']}")
                return jsonify({"success": True, "draft": draft})
                
        return jsonify({"success": False, "error": "Draft not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/drafts/<draft_id>/reject', methods=['POST'])
def reject_draft(draft_id):
    """Reject/Delete a draft."""
    drafts = load_drafts()
    drafts = [d for d in drafts if d['id'] != draft_id]
    save_drafts(drafts)
    
    log_activity("Draft Rejected", f"Rejected draft {draft_id}")
    return jsonify({"success": True, "message": "Draft rejected"})

@app.route('/api/quotes')
def get_quotes():
    """Get list of sent quotes (history)."""
    drafts = load_drafts()
    # Filter for sent quotes
    sent_quotes = [d for d in drafts if d.get('status') == 'SENT']
    sent_quotes.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify({"quotes": sent_quotes})

@app.route('/api/pdf/<filename>')
def get_pdf(filename):
    """Serve PDF files."""
    file_path = os.path.join('output', filename)
    if os.path.exists(file_path):
        return send_file(file_path, mimetype='application/pdf')
    return jsonify({"error": "PDF not found"}), 404

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get company settings."""
    return jsonify(load_settings())

@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update company settings."""
    try:
        new_settings = request.json
        current_settings = load_settings()
        updated_settings = {**current_settings, **new_settings}
        save_settings(updated_settings)
        log_activity("Settings Updated", "Company profile updated")
        return jsonify({"success": True, "settings": updated_settings})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

UPLOAD_FOLDER = 'frontend/public/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/upload/logo', methods=['POST'])
def upload_logo():
    """Upload company logo."""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
    
    if file:
        filename = 'company_logo.png' # Force standard name for simplicity
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Update settings with logo path
        current_settings = load_settings()
        current_settings['logo_path'] = file_path
        save_settings(current_settings)
        
        log_activity("Logo Uploaded", "New company logo uploaded")
        return jsonify({"success": True, "logo_path": file_path})

@app.route('/api/upload/pricing', methods=['POST'])
def upload_pricing():
    """Upload pricing CSV and reload engine."""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
    
    if file and file.filename.endswith('.csv'):
        file_path = 'data/pricing.csv'
        # Backup existing
        if os.path.exists(file_path):
            os.rename(file_path, f"{file_path}.bak")
            
        file.save(file_path)
        
        # Reload pricing engine
        try:
            global agent
            if agent:
                agent.pricing_engine.load_pricing_data()
            log_activity("Pricing Updated", "New pricing CSV uploaded")
            return jsonify({"success": True, "message": "Pricing data updated successfully"})
        except Exception as e:
            return jsonify({"success": False, "error": f"Error reloading pricing: {str(e)}"}), 500
            
    return jsonify({"success": False, "error": "Invalid file type"}), 400

if __name__ == '__main__':
    print("=" * 60)
    print("🌐 Starting Velocity Logic Web Interface (API Mode)")
    print("=" * 60)
    print("📱 Frontend should be running at: http://localhost:5173")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5001)

