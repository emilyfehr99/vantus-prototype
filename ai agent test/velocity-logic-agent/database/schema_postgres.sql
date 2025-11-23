-- Multi-Tenant Database Schema for Velocity Logic Agent (PostgreSQL / Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients (Businesses using the platform)
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    industry TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subscription_tier TEXT DEFAULT 'free',
    is_active INTEGER DEFAULT 1
);

-- Users (People who access the system)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Client Settings (per-client configuration)
CREATE TABLE IF NOT EXISTS client_settings (
    client_id TEXT PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
    logo_path TEXT,
    primary_color TEXT DEFAULT '#2563eb',
    secondary_color TEXT DEFAULT '#10b981',
    email_template TEXT,
    pricing_csv_path TEXT,
    tax_rate FLOAT DEFAULT 0.10,
    auto_approve_threshold INTEGER DEFAULT 95,
    company_tagline TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_email TEXT,
    company_website TEXT,
    auto_send_enabled INTEGER DEFAULT 0,
    client_agreement_path TEXT
);

-- Client Drafts (quotes, now per-client)
CREATE TABLE IF NOT EXISTS client_drafts (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    total FLOAT NOT NULL,
    pdf_url TEXT,
    status TEXT DEFAULT 'PENDING_APPROVAL',
    confidence INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    email_thread_id TEXT,
    in_reply_to TEXT,
    email_received_at TIMESTAMP WITH TIME ZONE,
    quote_sent_at TIMESTAMP WITH TIME ZONE,
    clarifying_questions TEXT,
    attention_reason TEXT
);

-- Line Items (per draft)
CREATE TABLE IF NOT EXISTS draft_line_items (
    id TEXT PRIMARY KEY,
    draft_id TEXT NOT NULL REFERENCES client_drafts(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    description TEXT,
    quantity FLOAT NOT NULL,
    unit_price FLOAT NOT NULL,
    unit TEXT DEFAULT 'Each',
    line_total FLOAT NOT NULL,
    match_score INTEGER
);

-- Customers (per client)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    total_quotes INTEGER DEFAULT 0,
    total_revenue FLOAT DEFAULT 0.0,
    first_quote_date TIMESTAMP WITH TIME ZONE,
    last_quote_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, email)
);

-- Activity Log (per client)
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_client ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_drafts_client ON client_drafts(client_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON client_drafts(status);
CREATE INDEX IF NOT EXISTS idx_line_items_draft ON draft_line_items(draft_id);
CREATE INDEX IF NOT EXISTS idx_customers_client ON customers(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_client ON activity_log(client_id);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since we are using anon key for now)
-- In production, you would restrict this to authenticated users
CREATE POLICY "Allow public access" ON clients FOR ALL USING (true);
CREATE POLICY "Allow public access" ON users FOR ALL USING (true);
CREATE POLICY "Allow public access" ON client_settings FOR ALL USING (true);
CREATE POLICY "Allow public access" ON client_drafts FOR ALL USING (true);
CREATE POLICY "Allow public access" ON draft_line_items FOR ALL USING (true);
CREATE POLICY "Allow public access" ON customers FOR ALL USING (true);
CREATE POLICY "Allow public access" ON activity_log FOR ALL USING (true);
