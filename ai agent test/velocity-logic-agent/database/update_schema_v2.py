import sqlite3
import os

def update_schema_v2():
    db_path = "database/velocity_logic.db"
    if not os.path.exists(db_path):
        print("Database not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Updating database schema (v2)...")

    # Add attention_reason to client_drafts
    try:
        cursor.execute("ALTER TABLE client_drafts ADD COLUMN attention_reason TEXT")
        print("Added attention_reason to client_drafts")
    except sqlite3.OperationalError as e:
        print(f"Skipped attention_reason: {e}")

    conn.commit()
    conn.close()
    print("Schema update complete.")

if __name__ == "__main__":
    update_schema_v2()
