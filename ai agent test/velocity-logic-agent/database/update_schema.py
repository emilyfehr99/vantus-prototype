import sqlite3
import os

def update_schema():
    db_path = "database/velocity_logic.db"
    if not os.path.exists(db_path):
        print("Database not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Updating database schema...")

    # Add auto_send_enabled to client_settings
    try:
        cursor.execute("ALTER TABLE client_settings ADD COLUMN auto_send_enabled INTEGER DEFAULT 0")
        print("Added auto_send_enabled to client_settings")
    except sqlite3.OperationalError as e:
        print(f"Skipped auto_send_enabled: {e}")

    # Add columns to client_drafts
    columns = [
        ("email_thread_id", "TEXT"),
        ("in_reply_to", "TEXT"),
        ("email_received_at", "TIMESTAMP"),
        ("quote_sent_at", "TIMESTAMP"),
        ("clarifying_questions", "TEXT")
    ]

    for col_name, col_type in columns:
        try:
            cursor.execute(f"ALTER TABLE client_drafts ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name} to client_drafts")
        except sqlite3.OperationalError as e:
            print(f"Skipped {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Schema update complete.")

if __name__ == "__main__":
    update_schema()
