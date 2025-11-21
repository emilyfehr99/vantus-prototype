from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

# Database file
DB_FILE = 'velocity_logic.db'

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Customers table
    c.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            company TEXT,
            phone TEXT,
            address TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # Invoices table
    c.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT UNIQUE NOT NULL,
            customer_id INTEGER NOT NULL,
            issue_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            subtotal REAL NOT NULL DEFAULT 0,
            tax_rate REAL DEFAULT 0,
            tax_amount REAL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # Invoice items table
    c.execute('''
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            quantity REAL NOT NULL DEFAULT 1,
            unit_price REAL NOT NULL,
            total REAL NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
        )
    ''')
    
    # Payments table
    c.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            payment_date TEXT NOT NULL,
            payment_method TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database on startup
init_db()

# ============ CUSTOMERS ============

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers"""
    conn = get_db_connection()
    customers = conn.execute('SELECT * FROM customers ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(customer) for customer in customers])

@app.route('/api/customers', methods=['POST'])
def create_customer():
    """Create a new customer"""
    data = request.json
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO customers (name, email, company, phone, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'),
        data.get('email'),
        data.get('company'),
        data.get('phone'),
        data.get('address'),
        now,
        now
    ))
    customer_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': customer_id, 'message': 'Customer created successfully'}), 201

@app.route('/api/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """Get a specific customer"""
    conn = get_db_connection()
    customer = conn.execute('SELECT * FROM customers WHERE id = ?', (customer_id,)).fetchone()
    conn.close()
    
    if customer:
        return jsonify(dict(customer))
    return jsonify({'error': 'Customer not found'}), 404

@app.route('/api/customers/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    """Update a customer"""
    data = request.json
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE customers
        SET name = ?, email = ?, company = ?, phone = ?, address = ?, updated_at = ?
        WHERE id = ?
    ''', (
        data.get('name'),
        data.get('email'),
        data.get('company'),
        data.get('phone'),
        data.get('address'),
        now,
        customer_id
    ))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Customer updated successfully'})

@app.route('/api/customers/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Delete a customer"""
    conn = get_db_connection()
    conn.execute('DELETE FROM customers WHERE id = ?', (customer_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Customer deleted successfully'})

# ============ INVOICES ============

def generate_invoice_number():
    """Generate a unique invoice number"""
    conn = get_db_connection()
    year = datetime.now().year
    # Get the last invoice number for this year
    last_invoice = conn.execute(
        'SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1',
        (f'VL-{year}-%',)
    ).fetchone()
    conn.close()
    
    if last_invoice:
        last_num = int(last_invoice['invoice_number'].split('-')[-1])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f'VL-{year}-{new_num:04d}'

@app.route('/api/invoices', methods=['GET'])
def get_invoices():
    """Get all invoices with customer info"""
    conn = get_db_connection()
    invoices = conn.execute('''
        SELECT i.*, c.name as customer_name, c.email as customer_email, c.company as customer_company
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        ORDER BY i.created_at DESC
    ''').fetchall()
    
    # Get items and payments for each invoice
    result = []
    for invoice in invoices:
        inv_dict = dict(invoice)
        
        # Get items
        items = conn.execute('SELECT * FROM invoice_items WHERE invoice_id = ?', (invoice['id'],)).fetchall()
        inv_dict['items'] = [dict(item) for item in items]
        
        # Get payments
        payments = conn.execute('SELECT * FROM payments WHERE invoice_id = ?', (invoice['id'],)).fetchall()
        inv_dict['payments'] = [dict(payment) for payment in payments]
        
        # Calculate paid amount
        paid_amount = sum(p['amount'] for p in inv_dict['payments'])
        inv_dict['paid_amount'] = paid_amount
        inv_dict['remaining_amount'] = inv_dict['total'] - paid_amount
        
        result.append(inv_dict)
    
    conn.close()
    return jsonify(result)

@app.route('/api/invoices', methods=['POST'])
def create_invoice():
    """Create a new invoice"""
    data = request.json
    now = datetime.now().isoformat()
    
    # Generate invoice number
    invoice_number = generate_invoice_number()
    
    # Calculate totals
    items = data.get('items', [])
    subtotal = sum(item.get('quantity', 1) * item.get('unit_price', 0) for item in items)
    tax_rate = data.get('tax_rate', 0) or 0
    tax_amount = subtotal * (tax_rate / 100)
    total = subtotal + tax_amount
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create invoice
    cursor.execute('''
        INSERT INTO invoices (invoice_number, customer_id, issue_date, due_date, status,
                             subtotal, tax_rate, tax_amount, total, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        invoice_number,
        data.get('customer_id'),
        data.get('issue_date'),
        data.get('due_date'),
        data.get('status', 'draft'),
        subtotal,
        tax_rate,
        tax_amount,
        total,
        data.get('notes'),
        now,
        now
    ))
    
    invoice_id = cursor.lastrowid
    
    # Create invoice items
    for item in items:
        item_total = item.get('quantity', 1) * item.get('unit_price', 0)
        cursor.execute('''
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            invoice_id,
            item.get('description'),
            item.get('quantity', 1),
            item.get('unit_price', 0),
            item_total
        ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'id': invoice_id, 'invoice_number': invoice_number, 'message': 'Invoice created successfully'}), 201

@app.route('/api/invoices/<int:invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    """Get a specific invoice"""
    conn = get_db_connection()
    invoice = conn.execute('''
        SELECT i.*, c.name as customer_name, c.email as customer_email, c.company as customer_company,
               c.phone as customer_phone, c.address as customer_address
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = ?
    ''', (invoice_id,)).fetchone()
    
    if not invoice:
        conn.close()
        return jsonify({'error': 'Invoice not found'}), 404
    
    inv_dict = dict(invoice)
    
    # Get items
    items = conn.execute('SELECT * FROM invoice_items WHERE invoice_id = ?', (invoice_id,)).fetchall()
    inv_dict['items'] = [dict(item) for item in items]
    
    # Get payments
    payments = conn.execute('SELECT * FROM payments WHERE invoice_id = ?', (invoice_id,)).fetchall()
    inv_dict['payments'] = [dict(payment) for payment in payments]
    
    # Calculate paid amount
    paid_amount = sum(p['amount'] for p in inv_dict['payments'])
    inv_dict['paid_amount'] = paid_amount
    inv_dict['remaining_amount'] = inv_dict['total'] - paid_amount
    
    conn.close()
    return jsonify(inv_dict)

@app.route('/api/invoices/<int:invoice_id>', methods=['PUT'])
def update_invoice(invoice_id):
    """Update an invoice"""
    data = request.json
    now = datetime.now().isoformat()
    
    # Calculate totals
    items = data.get('items', [])
    subtotal = sum(item.get('quantity', 1) * item.get('unit_price', 0) for item in items)
    tax_rate = data.get('tax_rate', 0) or 0
    tax_amount = subtotal * (tax_rate / 100)
    total = subtotal + tax_amount
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Update invoice
    cursor.execute('''
        UPDATE invoices
        SET customer_id = ?, issue_date = ?, due_date = ?, status = ?,
            subtotal = ?, tax_rate = ?, tax_amount = ?, total = ?, notes = ?, updated_at = ?
        WHERE id = ?
    ''', (
        data.get('customer_id'),
        data.get('issue_date'),
        data.get('due_date'),
        data.get('status'),
        subtotal,
        tax_rate,
        tax_amount,
        total,
        data.get('notes'),
        now,
        invoice_id
    ))
    
    # Delete old items and create new ones
    cursor.execute('DELETE FROM invoice_items WHERE invoice_id = ?', (invoice_id,))
    
    for item in items:
        item_total = item.get('quantity', 1) * item.get('unit_price', 0)
        cursor.execute('''
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            invoice_id,
            item.get('description'),
            item.get('quantity', 1),
            item.get('unit_price', 0),
            item_total
        ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Invoice updated successfully'})

@app.route('/api/invoices/<int:invoice_id>', methods=['DELETE'])
def delete_invoice(invoice_id):
    """Delete an invoice"""
    conn = get_db_connection()
    conn.execute('DELETE FROM invoices WHERE id = ?', (invoice_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Invoice deleted successfully'})

# ============ PAYMENTS ============

@app.route('/api/payments', methods=['GET'])
def get_payments():
    """Get all payments"""
    conn = get_db_connection()
    payments = conn.execute('''
        SELECT p.*, i.invoice_number, c.name as customer_name
        FROM payments p
        LEFT JOIN invoices i ON p.invoice_id = i.id
        LEFT JOIN customers c ON i.customer_id = c.id
        ORDER BY p.payment_date DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(payment) for payment in payments])

@app.route('/api/payments', methods=['POST'])
def create_payment():
    """Create a new payment"""
    data = request.json
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO payments (invoice_id, amount, payment_date, payment_method, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data.get('invoice_id'),
        data.get('amount'),
        data.get('payment_date'),
        data.get('payment_method'),
        data.get('notes'),
        now
    ))
    
    payment_id = cursor.lastrowid
    
    # Update invoice status if fully paid
    invoice = conn.execute('SELECT total FROM invoices WHERE id = ?', (data.get('invoice_id'),)).fetchone()
    if invoice:
        total_paid = sum(p['amount'] for p in conn.execute(
            'SELECT amount FROM payments WHERE invoice_id = ?', (data.get('invoice_id'),)
        ).fetchall())
        
        if total_paid >= invoice['total']:
            cursor.execute('UPDATE invoices SET status = ? WHERE id = ?', ('paid', data.get('invoice_id')))
        elif total_paid > 0:
            cursor.execute('UPDATE invoices SET status = ? WHERE id = ?', ('partial', data.get('invoice_id')))
    
    conn.commit()
    conn.close()
    
    return jsonify({'id': payment_id, 'message': 'Payment recorded successfully'}), 201

@app.route('/api/payments/<int:payment_id>', methods=['DELETE'])
def delete_payment(payment_id):
    """Delete a payment"""
    conn = get_db_connection()
    
    # Get invoice_id before deleting
    payment = conn.execute('SELECT invoice_id FROM payments WHERE id = ?', (payment_id,)).fetchone()
    invoice_id = payment['invoice_id'] if payment else None
    
    conn.execute('DELETE FROM payments WHERE id = ?', (payment_id,))
    
    # Update invoice status
    if invoice_id:
        invoice = conn.execute('SELECT total FROM invoices WHERE id = ?', (invoice_id,)).fetchone()
        if invoice:
            total_paid = sum(p['amount'] for p in conn.execute(
                'SELECT amount FROM payments WHERE invoice_id = ?', (invoice_id,)
            ).fetchall())
            
            cursor = conn.cursor()
            if total_paid >= invoice['total']:
                cursor.execute('UPDATE invoices SET status = ? WHERE id = ?', ('paid', invoice_id))
            elif total_paid > 0:
                cursor.execute('UPDATE invoices SET status = ? WHERE id = ?', ('partial', invoice_id))
            else:
                cursor.execute('UPDATE invoices SET status = ? WHERE id = ?', ('sent', invoice_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Payment deleted successfully'})

# ============ DASHBOARD STATS ============

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    conn = get_db_connection()
    
    # Total customers
    total_customers = conn.execute('SELECT COUNT(*) as count FROM customers').fetchone()['count']
    
    # Total invoices
    total_invoices = conn.execute('SELECT COUNT(*) as count FROM invoices').fetchone()['count']
    
    # Total revenue (sum of all paid amounts)
    total_revenue = conn.execute('SELECT COALESCE(SUM(amount), 0) as total FROM payments').fetchone()['total'] or 0
    
    # Outstanding invoices (total - paid)
    outstanding_result = conn.execute('''
        SELECT 
            COALESCE(SUM(i.total), 0) as total_invoiced,
            COALESCE(SUM(COALESCE(p.total_paid, 0)), 0) as total_paid
        FROM invoices i
        LEFT JOIN (
            SELECT invoice_id, SUM(amount) as total_paid
            FROM payments
            GROUP BY invoice_id
        ) p ON i.id = p.invoice_id
    ''').fetchone()
    
    outstanding = (outstanding_result['total_invoiced'] or 0) - (outstanding_result['total_paid'] or 0)
    
    # Monthly recurring revenue (MRR) - sum of monthly subscriptions
    # For now, we'll calculate based on invoices from the last 30 days
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
    mrr_result = conn.execute('''
        SELECT COALESCE(SUM(total), 0) as mrr
        FROM invoices
        WHERE issue_date >= ? AND status IN ('sent', 'partial', 'paid')
    ''', (thirty_days_ago,)).fetchone()
    mrr = mrr_result['mrr'] or 0
    
    # Recent invoices
    recent_invoices = conn.execute('''
        SELECT i.*, c.name as customer_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        ORDER BY i.created_at DESC
        LIMIT 5
    ''').fetchall()
    
    # Revenue by month (last 6 months)
    revenue_by_month = []
    for i in range(5, -1, -1):
        month_start = (datetime.now() - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_revenue = conn.execute('''
            SELECT COALESCE(SUM(amount), 0) as revenue
            FROM payments
            WHERE payment_date >= ? AND payment_date <= ?
        ''', (month_start.isoformat(), month_end.isoformat())).fetchone()['revenue'] or 0
        
        revenue_by_month.append({
            'month': month_start.strftime('%Y-%m'),
            'label': month_start.strftime('%b %Y'),
            'revenue': month_revenue
        })
    
    conn.close()
    
    return jsonify({
        'total_customers': total_customers,
        'total_invoices': total_invoices,
        'total_revenue': total_revenue,
        'outstanding': outstanding,
        'mrr': mrr,
        'recent_invoices': [dict(inv) for inv in recent_invoices],
        'revenue_by_month': revenue_by_month
    })

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    print("🚀 Velocity Logic API Server")
    print("=" * 50)
    print(f"Database: {DB_FILE}")
    print("Available endpoints:")
    print("  GET  /api/health")
    print("  GET  /api/dashboard/stats")
    print("  GET  /api/customers")
    print("  POST /api/customers")
    print("  GET  /api/invoices")
    print("  POST /api/invoices")
    print("  GET  /api/payments")
    print("  POST /api/payments")
    print("=" * 50)
    port = int(os.environ.get('PORT', 5003))
    print(f"Starting server on http://localhost:{port}")
    print()
    
    app.run(debug=True, host='0.0.0.0', port=port)

