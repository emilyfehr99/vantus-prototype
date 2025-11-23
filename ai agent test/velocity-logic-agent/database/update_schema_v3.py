import sqlite3
import os

def update_schema_v3():
    db_path = "database/velocity_logic.db"
    if not os.path.exists(db_path):
        print("Database not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Updating database schema (v3)...")

    # Add client_agreement_path to client_settings
    try:
        cursor.execute("ALTER TABLE client_settings ADD COLUMN client_agreement_path TEXT")
        print("Added client_agreement_path to client_settings")
    except sqlite3.OperationalError as e:
        print(f"Skipped client_agreement_path: {e}")

    conn.commit()
    conn.close()
    print("Schema update complete.")

if __name__ == "__main__":
    update_schema_v3()
