import sqlite3
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def migrate_data():
    db_path = "database/velocity_logic.db"
    if not os.path.exists(db_path):
        print("Database not found.")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("Starting migration to Supabase...")

    # 1. Migrate Clients
    print("Migrating Clients...")
    cursor.execute("SELECT * FROM clients")
    clients = [dict(row) for row in cursor.fetchall()]
    if clients:
        try:
            supabase.table("clients").upsert(clients).execute()
            print(f"✓ Migrated {len(clients)} clients")
        except Exception as e:
            print(f"✗ Error migrating clients: {e}")

    # 2. Migrate Users
    print("Migrating Users...")
    cursor.execute("SELECT * FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    if users:
        try:
            supabase.table("users").upsert(users).execute()
            print(f"✓ Migrated {len(users)} users")
        except Exception as e:
            print(f"✗ Error migrating users: {e}")

    # 3. Migrate Client Settings
    print("Migrating Client Settings...")
    cursor.execute("SELECT * FROM client_settings")
    settings = [dict(row) for row in cursor.fetchall()]
    if settings:
        try:
            supabase.table("client_settings").upsert(settings).execute()
            print(f"✓ Migrated {len(settings)} settings")
        except Exception as e:
            print(f"✗ Error migrating settings: {e}")

    # 4. Migrate Client Drafts
    print("Migrating Client Drafts...")
    cursor.execute("SELECT * FROM client_drafts")
    drafts = [dict(row) for row in cursor.fetchall()]
    if drafts:
        try:
            supabase.table("client_drafts").upsert(drafts).execute()
            print(f"✓ Migrated {len(drafts)} drafts")
        except Exception as e:
            print(f"✗ Error migrating drafts: {e}")

    # 5. Migrate Line Items
    print("Migrating Line Items...")
    cursor.execute("SELECT * FROM draft_line_items")
    items = [dict(row) for row in cursor.fetchall()]
    if items:
        try:
            supabase.table("draft_line_items").upsert(items).execute()
            print(f"✓ Migrated {len(items)} line items")
        except Exception as e:
            print(f"✗ Error migrating line items: {e}")

    # 6. Migrate Customers
    print("Migrating Customers...")
    cursor.execute("SELECT * FROM customers")
    customers = [dict(row) for row in cursor.fetchall()]
    if customers:
        # Remove ID if it's not a UUID (Supabase will generate one)
        # Or keep it if we want to preserve IDs, but SQLite IDs might not be UUIDs
        # For now, let's try to upsert as is, assuming IDs are compatible or we want to keep them
        try:
            supabase.table("customers").upsert(customers).execute()
            print(f"✓ Migrated {len(customers)} customers")
        except Exception as e:
            print(f"✗ Error migrating customers: {e}")

    # 7. Migrate Activity Log
    print("Migrating Activity Log...")
    cursor.execute("SELECT * FROM activity_log")
    logs = [dict(row) for row in cursor.fetchall()]
    if logs:
        try:
            supabase.table("activity_log").upsert(logs).execute()
            print(f"✓ Migrated {len(logs)} activity logs")
        except Exception as e:
            print(f"✗ Error migrating activity logs: {e}")

    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate_data()
