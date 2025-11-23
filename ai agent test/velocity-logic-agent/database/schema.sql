-- Multi-Tenant Database Schema for Velocity Logic Agent
-- SQLite database supporting multiple clients (businesses)

-- Clients (Businesses using the platform)
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    industry TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_tier TEXT DEFAULT 'free',
    is_active INTEGER DEFAULT 1
);

-- Users (People who access the system)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Client Settings (per-client configuration)
CREATE TABLE IF NOT EXISTS client_settings (
    client_id TEXT PRIMARY KEY,
    logo_path TEXT,
    primary_color TEXT DEFAULT '#2563eb',
    secondary_color TEXT DEFAULT '#10b981',
    email_template TEXT,
    pricing_csv_path TEXT,
    tax_rate REAL DEFAULT 0.10,
    auto_approve_threshold INTEGER DEFAULT 95,
    company_tagline TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_email TEXT,
    company_website TEXT,
    auto_send_enabled INTEGER DEFAULT 0,
    client_agreement_path TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Client Drafts (quotes, now per-client)
CREATE TABLE IF NOT EXISTS client_drafts (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    quote_number TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    total REAL NOT NULL,
    pdf_url TEXT,
    status TEXT DEFAULT 'PENDING_APPROVAL',
    confidence INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    approved_by TEXT,
    approved_at TIMESTAMP,
    email_thread_id TEXT,
    in_reply_to TEXT,
    email_received_at TIMESTAMP,
    quote_sent_at TIMESTAMP,
    clarifying_questions TEXT,
    attention_reason TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Line Items (per draft)
CREATE TABLE IF NOT EXISTS draft_line_items (
    id TEXT PRIMARY KEY,
    draft_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    description TEXT,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    unit TEXT DEFAULT 'Each',
    line_total REAL NOT NULL,
    match_score INTEGER,
    FOREIGN KEY (draft_id) REFERENCES client_drafts(id) ON DELETE CASCADE
);

-- Customers (per client)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    total_quotes INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0.0,
    first_quote_date TIMESTAMP,
    last_quote_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE(client_id, email)
);

-- Activity Log (per client)
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_client ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_drafts_client ON client_drafts(client_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON client_drafts(status);
CREATE INDEX IF NOT EXISTS idx_line_items_draft ON draft_line_items(draft_id);
CREATE INDEX IF NOT EXISTS idx_customers_client ON customers(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_client ON activity_log(client_id);
