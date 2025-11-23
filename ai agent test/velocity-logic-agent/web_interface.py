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

# ============================================
# Admin Analytics Endpoints
# ============================================

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get aggregated stats for the master dashboard."""
    try:
        # Total Clients
        clients_response = db.supabase.table("clients").select("id", count='exact').execute()
        total_clients = clients_response.count

        # Total Revenue (sum of all accepted quotes)
        revenue_response = db.supabase.table("client_drafts")\
            .select("total")\
            .eq("status", "ACCEPTED")\
            .execute()
        
        total_revenue = sum(float(row['total']) for row in revenue_response.data if row['total'])

        # Active Quotes (SENT or DRAFT)
        active_quotes_response = db.supabase.table("client_drafts")\
            .select("id", count='exact')\
            .in_("status", ["SENT", "DRAFT"])\
            .execute()
        active_quotes = active_quotes_response.count

        return jsonify({
            "total_clients": total_clients,
            "total_revenue": total_revenue,
            "active_quotes": active_quotes
        })
    except Exception as e:
        print(f"Error in get_admin_stats: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/clients', methods=['GET'])
def get_admin_clients():
    """Get list of all clients with their stats."""
    try:
        # Fetch all clients
        clients_response = db.supabase.table("clients").select("*").execute()
        clients = clients_response.data

        client_data = []
        for client in clients:
            # Get quote count for this client
            quotes_response = db.supabase.table("client_drafts")\
                .select("id", count='exact')\
                .eq("client_id", client['id'])\
                .execute()
            
            # Get revenue for this client
            revenue_response = db.supabase.table("client_drafts")\
                .select("total")\
                .eq("client_id", client['id'])\
                .eq("status", "ACCEPTED")\
                .execute()
            revenue = sum(float(row['total']) for row in revenue_response.data if row['total'])

            client_data.append({
                "id": client['id'],
                "company_name": client['company_name'],
                "industry": client['industry'],
                "subscription_tier": client['subscription_tier'],
                "total_quotes": quotes_response.count,
                "total_revenue": revenue,
                "joined_at": client.get('created_at', 'N/A') # Assuming created_at exists or N/A
            })
        
        return jsonify(client_data)
    except Exception as e:
        print(f"Error in get_admin_clients: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/quarterly-revenue', methods=['GET'])
def get_quarterly_revenue():
    """Get revenue broken down by quarter for the current year."""
    try:
        from datetime import datetime
        
        # Get all accepted quotes with their created_at dates
        response = db.supabase.table("client_drafts")\
            .select("total, created_at")\
            .eq("status", "ACCEPTED")\
            .execute()
        
        # Initialize quarterly data
        quarters = {"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0}
        current_year = datetime.now().year
        
        for row in response.data:
            if not row.get('total') or not row.get('created_at'):
                continue
            
            # Parse the created_at date
            created_date = datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
            
            # Only count current year
            if created_date.year == current_year:
                month = created_date.month
                revenue = float(row['total'])
                
                if month <= 3:
                    quarters["Q1"] += revenue
                elif month <= 6:
                    quarters["Q2"] += revenue
                elif month <= 9:
                    quarters["Q3"] += revenue
                else:
                    quarters["Q4"] += revenue
        
        return jsonify(quarters)
    except Exception as e:
        print(f"Error in get_quarterly_revenue: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/metrics', methods=['GET'])
def get_admin_metrics():
    """Get additional business metrics."""
    try:
        from datetime import datetime, timedelta
        
        # Get all drafts
        all_drafts = db.supabase.table("client_drafts").select("*").execute()
        
        # Client Churn (clients with no quotes in last 90 days)
        ninety_days_ago = (datetime.now() - timedelta(days=90)).isoformat()
        recent_clients = set()
        for draft in all_drafts.data:
            if draft.get('created_at') and draft['created_at'] > ninety_days_ago:
                recent_clients.add(draft['client_id'])
        
        total_clients_response = db.supabase.table("clients").select("id", count='exact').execute()
        total_clients = total_clients_response.count
        inactive_clients = total_clients - len(recent_clients)
        churn_rate = (inactive_clients / total_clients * 100) if total_clients > 0 else 0
        
        # Average Deal Size
        accepted_quotes = [float(d['total']) for d in all_drafts.data if d.get('status') == 'ACCEPTED' and d.get('total')]
        avg_deal_size = sum(accepted_quotes) / len(accepted_quotes) if accepted_quotes else 0
        
        # Quote Conversion Rate
        sent_quotes = len([d for d in all_drafts.data if d.get('status') in ['SENT', 'ACCEPTED']])
        accepted_count = len(accepted_quotes)
        conversion_rate = (accepted_count / sent_quotes * 100) if sent_quotes > 0 else 0
        
        # Month-over-Month Growth
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        
        current_month_revenue = sum(
            float(d['total']) for d in all_drafts.data 
            if d.get('status') == 'ACCEPTED' and d.get('total') and d.get('created_at') 
            and datetime.fromisoformat(d['created_at'].replace('Z', '+00:00')) >= current_month_start
        )
        
        last_month_revenue = sum(
            float(d['total']) for d in all_drafts.data 
            if d.get('status') == 'ACCEPTED' and d.get('total') and d.get('created_at')
            and last_month_start <= datetime.fromisoformat(d['created_at'].replace('Z', '+00:00')) < current_month_start
        )
        
        mom_growth = ((current_month_revenue - last_month_revenue) / last_month_revenue * 100) if last_month_revenue > 0 else 0
        
        return jsonify({
            "churn_rate": round(churn_rate, 1),
            "avg_deal_size": round(avg_deal_size, 2),
            "conversion_rate": round(conversion_rate, 1),
            "mom_growth": round(mom_growth, 1),
            "current_month_revenue": round(current_month_revenue, 2),
            "last_month_revenue": round(last_month_revenue, 2)
        })
    except Exception as e:
        print(f"Error in get_admin_metrics: {e}")
        return jsonify({"error": str(e)}), 500

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
        'auto_approve_threshold': settings.get('auto_approve_threshold'),
        'auto_send_enabled': settings.get('auto_send_enabled', 0),
        'email_template': settings.get('email_template')
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
    
    if file and file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
        # Create client-specific data directory
        data_dir = os.path.join('data', request.client_id)
        os.makedirs(data_dir, exist_ok=True)
        
        # Determine filename based on extension
        ext = os.path.splitext(file.filename)[1].lower()
        filename = f'pricing{ext}'
        filepath = os.path.join(data_dir, filename)
        
        # Save file
        file.save(filepath)
        
        # Update settings
        db.update_client_settings(request.client_id, {'pricing_csv_path': filepath})
        
        # Reload agent's pricing engine
        try:
            global agent
            if agent:
                # Re-initialize pricing engine to pick up new file
                # We need to update the path in the engine instance
                agent.pricing_engine.pricing_csv_path = filepath
                agent.pricing_engine.load_pricing_data()
        except Exception as e:
            print(f"Error reloading pricing: {e}")
        
        db.log_activity(request.client_id, "Pricing Updated", f"Pricing file ({ext}) uploaded", request.user_id)
        return jsonify({"success": True, "message": "Pricing data updated"})
    
    return jsonify({"error": "Invalid file type. Please upload .csv, .xlsx, or .xls"}), 400

@app.route('/api/settings/sheets-connect', methods=['POST'])
@require_auth
def connect_google_sheets():
    """Connect to Google Sheets for pricing data."""
    data = request.json
    sheets_url = data.get('sheets_url')
    
    if not sheets_url:
        return jsonify({"error": "No Google Sheets URL provided"}), 400
    
    try:
        from services.sheets_service import SheetsService
        
        # Initialize Sheets service
        sheets_service = SheetsService()
        
        # Test connection
        if not sheets_service.test_connection(sheets_url):
            return jsonify({"error": "Failed to connect to Google Sheets. Please check the URL and permissions."}), 400
        
        # Load pricing data from Sheets
        global agent
        if agent:
            agent.pricing_engine.load_from_google_sheets(sheets_service, sheets_url)
        
        # Update settings
        from datetime import datetime
        db.update_client_settings(request.client_id, {
            'pricing_source': 'sheets',
            'sheets_url': sheets_url,
            'sheets_last_sync': datetime.now().isoformat()
        })
        
        db.log_activity(request.client_id, "Google Sheets Connected", "Pricing data synced from Google Sheets", request.user_id)
        
        return jsonify({
            "success": True, 
            "message": "Successfully connected to Google Sheets",
            "items_loaded": len(agent.pricing_engine.df) if agent else 0
        })
    
    except Exception as e:
        print(f"Error connecting to Google Sheets: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings/sheets-sync', methods=['POST'])
@require_auth
def sync_google_sheets():
    """Manually sync pricing data from Google Sheets."""
    try:
        # Get current sheets URL from settings
        settings = db.get_client_settings(request.client_id)
        sheets_url = settings.get('sheets_url')
        
        if not sheets_url:
            return jsonify({"error": "No Google Sheets URL configured"}), 400
        
        from services.sheets_service import SheetsService
        
        # Initialize Sheets service
        sheets_service = SheetsService()
        
        # Load pricing data from Sheets
        global agent
        if agent:
            agent.pricing_engine.load_from_google_sheets(sheets_service, sheets_url)
        
        # Update last sync timestamp
        from datetime import datetime
        db.update_client_settings(request.client_id, {
            'sheets_last_sync': datetime.now().isoformat()
        })
        
        db.log_activity(request.client_id, "Sheets Synced", "Pricing data refreshed from Google Sheets", request.user_id)
        
        return jsonify({
            "success": True,
            "message": "Pricing data synced successfully",
            "items_loaded": len(agent.pricing_engine.df) if agent else 0
        })
    
    except Exception as e:
        print(f"Error syncing Google Sheets: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings/agreement', methods=['POST'])
@require_auth
def upload_agreement():
    """Upload client agreement file."""
    if 'agreement' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['agreement']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and file.filename.lower().endswith(('.pdf', '.doc', '.docx')):
        # Create client-specific data directory
        data_dir = os.path.join('data', request.client_id)
        os.makedirs(data_dir, exist_ok=True)
        
        # Determine filename based on extension
        ext = os.path.splitext(file.filename)[1].lower()
        filename = f'client_agreement{ext}'
        filepath = os.path.join(data_dir, filename)
        
        # Save file
        file.save(filepath)
        
        # Update settings
        db.update_client_settings(request.client_id, {'client_agreement_path': filepath})
        
        db.log_activity(request.client_id, "Agreement Updated", f"Client agreement ({ext}) uploaded", request.user_id)
        
        return jsonify({"success": True, "message": "Client agreement updated", "path": filepath})
    
    return jsonify({"error": "Invalid file type. Please upload .pdf, .doc, or .docx"}), 400

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
# Customer Endpoints (Protected)
# ============================================

@app.route('/api/customers', methods=['GET'])
@require_auth
def get_customers():
    """Get all customers for authenticated client from drafts."""
    try:
        # Fetch all drafts for the client
        response = db.supabase.table("client_drafts").select("*").eq("client_id", request.client_id).execute()
        drafts = response.data
        
        # Aggregate data in Python
        customer_stats = {}
        
        for draft in drafts:
            email = draft.get('customer_email') or 'N/A'
            name = draft.get('customer_name')
            if not name:
                continue
                
            key = (name, email)
            
            if key not in customer_stats:
                customer_stats[key] = {
                    'name': name,
                    'email': email,
                    'created_at': draft['created_at'],
                    'quote_count': 0,
                    'total_revenue': 0,
                    'last_quote_date': draft['created_at']
                }
            
            stats = customer_stats[key]
            stats['quote_count'] += 1
            if draft.get('status') == 'APPROVED':
                stats['total_revenue'] += draft.get('total', 0)
            
            # Update dates
            if draft['created_at'] < stats['created_at']:
                stats['created_at'] = draft['created_at']
            if draft['created_at'] > stats['last_quote_date']:
                stats['last_quote_date'] = draft['created_at']
        
        # Convert to list and sort
        customers = []
        for idx, ((name, email), stats) in enumerate(customer_stats.items()):
            stats['id'] = idx + 1
            customers.append(stats)
            
        # Sort by total revenue desc
        customers.sort(key=lambda x: x['total_revenue'], reverse=True)
        
        return jsonify(customers)
    except Exception as e:
        print(f"Error in get_customers: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/customers/<customer_id>/quotes', methods=['GET'])
@require_auth
def get_customer_quotes(customer_id):
    """Get all quotes for a specific customer by name."""
    try:
        # Get customer name from ID (since we're using sequential IDs)
        # Get customer name from ID (since we're using sequential IDs)
        # Re-fetch customers to map ID to name (inefficient but consistent with previous logic)
        # In a real app, we'd use the customer UUID directly
        
        # Fetch all drafts for the client
        response = db.supabase.table("client_drafts").select("customer_name").eq("client_id", request.client_id).neq("customer_name", "null").execute()
        all_names = sorted(list(set(d['customer_name'] for d in response.data if d.get('customer_name'))))
        
        customer_idx = int(customer_id) - 1
        
        if customer_idx < 0 or customer_idx >= len(all_names):
            return jsonify({"error": "Customer not found"}), 404
        
        customer_name = all_names[customer_idx]
        
        # Get quotes for this customer
        response = db.supabase.table("client_drafts")\
            .select("id, quote_number, total, status, created_at")\
            .eq("customer_name", customer_name)\
            .eq("client_id", request.client_id)\
            .order("created_at", desc=True)\
            .execute()
        
        quotes = []
        for row in response.data:
            quotes.append({
                'id': row['id'],
                'quote_number': row['quote_number'],
                'total': row['total'],
                'status': row['status'],
                'created_at': row['created_at']
            })
            
        return jsonify(quotes)
    except Exception as e:
        print(f"Error in get_customer_quotes: {e}")
        return jsonify({"error": str(e)}), 500

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
