"""
Velocity Logic - Web Interface
Simple Flask web interface for the Velocity Logic agent.
"""

from flask import Flask, render_template_string, request, jsonify, send_file
import os
import json
from datetime import datetime
from main import VelocityLogicAgent
import threading
import time

app = Flask(__name__)
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
init_agent()

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Velocity Logic - Agent Control Panel</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #e2e8f0;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(45, 212, 191, 0.3);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(45, 212, 191, 0.1);
        }
        .header h1 {
            color: #2dd4bf;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .header p {
            color: #94a3b8;
            font-size: 1.1rem;
        }
        .card {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(45, 212, 191, 0.3);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 4px 20px rgba(45, 212, 191, 0.1);
        }
        .card h2 {
            color: #2dd4bf;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: #cbd5e1;
            margin-bottom: 8px;
            font-weight: 500;
        }
        input[type="text"],
        input[type="email"],
        textarea {
            width: 100%;
            padding: 12px;
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(45, 212, 191, 0.3);
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus,
        textarea:focus {
            outline: none;
            border-color: #2dd4bf;
        }
        textarea {
            min-height: 150px;
            resize: vertical;
        }
        button {
            background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
            color: #0f172a;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(45, 212, 191, 0.4);
        }
        button:active {
            transform: translateY(0);
        }
        .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
        }
        .status.active {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .status.inactive {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .result {
            margin-top: 20px;
            padding: 20px;
            background: rgba(30, 41, 59, 0.8);
            border-radius: 8px;
            border-left: 4px solid #2dd4bf;
        }
        .result.success {
            border-left-color: #22c55e;
        }
        .result.error {
            border-left-color: #ef4444;
        }
        .result h3 {
            color: #2dd4bf;
            margin-bottom: 10px;
        }
        .result pre {
            background: rgba(15, 23, 42, 0.8);
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            color: #cbd5e1;
            font-size: 13px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .stat-box {
            background: rgba(30, 41, 59, 0.8);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid rgba(45, 212, 191, 0.2);
        }
        .stat-box .label {
            color: #94a3b8;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .stat-box .value {
            color: #2dd4bf;
            font-size: 24px;
            font-weight: 600;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
            color: #2dd4bf;
        }
        .loading.active {
            display: block;
        }
        .spinner {
            border: 3px solid rgba(45, 212, 191, 0.3);
            border-top: 3px solid #2dd4bf;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Velocity Logic</h1>
            <p>Automated Quoting Agent Control Panel</p>
        </div>

        <div class="grid">
            <div class="card">
                <h2>Agent Status</h2>
                <div id="status-display">
                    <div class="stat-box">
                        <div class="label">Status</div>
                        <div class="value" id="agent-status">Checking...</div>
                    </div>
                    <div class="stat-box">
                        <div class="label">Processed Emails</div>
                        <div class="value" id="processed-count">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="label">Last Check</div>
                        <div class="value" id="last-check">Never</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>Test Quote Generation</h2>
                <form id="quote-form">
                    <div class="form-group">
                        <label for="customer-name">Customer Name</label>
                        <input type="text" id="customer-name" name="customer_name" value="John Smith" required>
                    </div>
                    <div class="form-group">
                        <label for="customer-email">Customer Email</label>
                        <input type="email" id="customer-email" name="customer_email" value="john.smith@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="email-body">Email Body (Service Request)</label>
                        <textarea id="email-body" name="email_body" required>Hi, I need a new furnace installed at my home. The old one broke down and it's getting cold. Please send me a quote.

Thanks,
John Smith</textarea>
                    </div>
                    <button type="submit">Generate Quote</button>
                </form>
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <p>Processing email and generating quote...</p>
                </div>
                <div id="result"></div>
            </div>
        </div>

        <div class="card">
            <h2>Recent Quotes</h2>
            <div id="quotes-list">
                <p style="color: #94a3b8;">No quotes generated yet. Test the quote generator above!</p>
            </div>
        </div>
    </div>

    <script>
        // Update status on load and periodically
        function updateStatus() {
            fetch('/api/status')
                .then(res => res.json())
                .then(data => {
                    document.getElementById('agent-status').textContent = data.agent_ready ? 'Ready' : 'Not Ready';
                    document.getElementById('processed-count').textContent = data.processed_count || 0;
                    document.getElementById('last-check').textContent = data.last_check || 'Never';
                })
                .catch(err => console.error('Error fetching status:', err));
        }

        // Handle quote form submission
        document.getElementById('quote-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                customer_name: formData.get('customer_name'),
                customer_email: formData.get('customer_email'),
                email_body: formData.get('email_body')
            };

            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            
            loading.classList.add('active');
            result.innerHTML = '';

            try {
                const response = await fetch('/api/process-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const responseData = await response.json();
                loading.classList.remove('active');

                if (responseData.success) {
                    result.innerHTML = `
                        <div class="result success">
                            <h3>✅ Quote Generated Successfully!</h3>
                            <p><strong>Quote Number:</strong> ${responseData.quote_number}</p>
                            <p><strong>Customer:</strong> ${responseData.customer_name}</p>
                            <p><strong>Total:</strong> $${responseData.total.toFixed(2)}</p>
                            <p><strong>PDF:</strong> <a href="${responseData.pdf_url}" target="_blank" style="color: #2dd4bf;">Download PDF</a></p>
                            <h4>Line Items:</h4>
                            <pre>${JSON.stringify(responseData.line_items, null, 2)}</pre>
                        </div>
                    `;
                    updateQuotesList();
                } else {
                    result.innerHTML = `
                        <div class="result error">
                            <h3>❌ Error</h3>
                            <p>${responseData.error || 'Unknown error occurred'}</p>
                        </div>
                    `;
                }
            } catch (error) {
                loading.classList.remove('active');
                result.innerHTML = `
                    <div class="result error">
                        <h3>❌ Error</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        });

        // Update quotes list
        function updateQuotesList() {
            fetch('/api/quotes')
                .then(res => res.json())
                .then(data => {
                    const listEl = document.getElementById('quotes-list');
                    if (data.quotes && data.quotes.length > 0) {
                        listEl.innerHTML = data.quotes.map(quote => `
                            <div style="padding: 15px; margin-bottom: 10px; background: rgba(30, 41, 59, 0.8); border-radius: 8px; border-left: 4px solid #2dd4bf;">
                                <strong style="color: #2dd4bf;">${quote.quote_number}</strong> - 
                                ${quote.customer_name} - 
                                $${quote.total.toFixed(2)} - 
                                <a href="${quote.pdf_url}" target="_blank" style="color: #2dd4bf;">View PDF</a>
                            </div>
                        `).join('');
                    } else {
                        listEl.innerHTML = '<p style="color: #94a3b8;">No quotes generated yet.</p>';
                    }
                })
                .catch(err => console.error('Error fetching quotes:', err));
        }

        // Initial load
        updateStatus();
        updateQuotesList();
        setInterval(updateStatus, 5000); // Update every 5 seconds
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Main dashboard page."""
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/status')
def get_status():
    """Get agent status."""
    return jsonify({
        "agent_ready": agent is not None,
        "processed_count": agent_status["processed_count"],
        "last_check": agent_status["last_check"]
    })

@app.route('/api/process-email', methods=['POST'])
def process_email():
    """Process an email and generate a quote."""
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
        
        # Process the email
        success = agent.process_email(email_body, customer_email)
        
        if success:
            # Get the latest generated PDF
            output_dir = 'output'
            if os.path.exists(output_dir):
                pdf_files = [f for f in os.listdir(output_dir) if f.endswith('.pdf')]
                if pdf_files:
                    latest_pdf = max(pdf_files, key=lambda f: os.path.getmtime(os.path.join(output_dir, f)))
                    pdf_url = f'/api/pdf/{latest_pdf}'
                    
                    # Extract quote data from the latest PDF filename
                    quote_number = latest_pdf.replace('quote_', '').replace('.pdf', '')
                    
                    # Try to get quote details from the agent's last processing
                    # For now, return basic info
                    return jsonify({
                        "success": True,
                        "quote_number": quote_number,
                        "customer_name": customer_name,
                        "total": 0,  # Would need to track this
                        "pdf_url": pdf_url,
                        "line_items": []
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

@app.route('/api/quotes')
def get_quotes():
    """Get list of generated quotes."""
    quotes = []
    output_dir = 'output'
    
    if os.path.exists(output_dir):
        pdf_files = [f for f in os.listdir(output_dir) if f.endswith('.pdf')]
        for pdf_file in sorted(pdf_files, key=lambda f: os.path.getmtime(os.path.join(output_dir, f)), reverse=True)[:10]:
            quote_number = pdf_file.replace('quote_', '').replace('.pdf', '')
            file_path = os.path.join(output_dir, pdf_file)
            file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
            
            quotes.append({
                "quote_number": quote_number,
                "customer_name": "Customer",  # Would need to track this
                "total": 0,  # Would need to track this
                "pdf_url": f'/api/pdf/{pdf_file}',
                "created_at": file_time.isoformat()
            })
    
    return jsonify({"quotes": quotes})

@app.route('/api/pdf/<filename>')
def get_pdf(filename):
    """Serve PDF files."""
    file_path = os.path.join('output', filename)
    if os.path.exists(file_path):
        return send_file(file_path, mimetype='application/pdf')
    return jsonify({"error": "PDF not found"}), 404

if __name__ == '__main__':
    print("=" * 60)
    print("🌐 Starting Velocity Logic Web Interface")
    print("=" * 60)
    print("📱 Open your browser to: http://localhost:5001")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5001)

