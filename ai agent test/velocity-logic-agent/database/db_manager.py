"""
Database Manager for Multi-Tenant Velocity Logic Agent
Handles all database operations with SQLite.
"""

import sqlite3
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
import os


class DatabaseManager:
    """Manages SQLite database operations for multi-tenant system."""
    
    def __init__(self, db_path: str = "database/velocity_logic.db"):
        """Initialize database connection."""
        self.db_path = db_path
        self._ensure_database_exists()
    
    def _ensure_database_exists(self):
        """Create database and tables if they don't exist."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        # Read schema
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        with open(schema_path, 'r') as f:
            schema = f.read()
        
        # Execute schema
        conn = self.get_connection()
        conn.executescript(schema)
        conn.commit()
        conn.close()
    
    def get_connection(self) -> sqlite3.Connection:
        """Get a new database connection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        return conn
    
    # ============================================
    # Client Operations
    # ============================================
    
    def create_client(self, company_name: str, industry: str = None, 
                     subscription_tier: str = 'free') -> str:
        """Create a new client (business)."""
        client_id = str(uuid.uuid4())
        conn = self.get_connection()
        
        conn.execute("""
            INSERT INTO clients (id, company_name, industry, subscription_tier)
            VALUES (?, ?, ?, ?)
        """, (client_id, company_name, industry, subscription_tier))
        
        # Create default settings
        conn.execute("""
            INSERT INTO client_settings (client_id)
            VALUES (?)
        """, (client_id,))
        
        conn.commit()
        conn.close()
        
        return client_id
    
    def get_client(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get client by ID."""
        conn = self.get_connection()
        row = conn.execute(
            "SELECT * FROM clients WHERE id = ?", (client_id,)
        ).fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    # ============================================
    # User Operations
    # ============================================
    
    def create_user(self, client_id: str, email: str, password_hash: str,
                   full_name: str = None, role: str = 'user') -> str:
        """Create a new user."""
        user_id = str(uuid.uuid4())
        conn = self.get_connection()
        
        conn.execute("""
            INSERT INTO users (id, client_id, email, password_hash, full_name, role)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, client_id, email, password_hash, full_name, role))
        
        conn.commit()
        conn.close()
        
        return user_id
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email."""
        conn = self.get_connection()
        row = conn.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        ).fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID."""
        conn = self.get_connection()
        row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def update_last_login(self, user_id: str):
        """Update user's last login timestamp."""
        conn = self.get_connection()
        conn.execute("""
            UPDATE users SET last_login = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (user_id,))
        conn.commit()
        conn.close()
    
    # ============================================
    # Settings Operations
    # ============================================
    
    def get_client_settings(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get settings for a client."""
        conn = self.get_connection()
        row = conn.execute(
            "SELECT * FROM client_settings WHERE client_id = ?", (client_id,)
        ).fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def update_client_settings(self, client_id: str, settings: Dict[str, Any]):
        """Update client settings."""
        conn = self.get_connection()
        
        # Build dynamic UPDATE query
        fields = []
        values = []
        for key, value in settings.items():
            if key != 'client_id':  # Don't update primary key
                fields.append(f"{key} = ?")
                values.append(value)
        
        if fields:
            values.append(client_id)
            query = f"UPDATE client_settings SET {', '.join(fields)} WHERE client_id = ?"
            conn.execute(query, values)
            conn.commit()
        
        conn.close()
    
    # ============================================
    # Draft Operations
    # ============================================
    
    def create_draft(self, client_id: str, draft_data: Dict[str, Any], 
                    line_items: List[Dict[str, Any]]) -> str:
        """Create a new draft with line items."""
        draft_id = draft_data.get('id', str(uuid.uuid4()))
        conn = self.get_connection()
        
        # Insert draft
        conn.execute("""
            INSERT INTO client_drafts 
            (id, client_id, quote_number, customer_email, customer_name, total, 
             pdf_url, status, confidence, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            draft_id, client_id, draft_data['quote_number'],
            draft_data['customer_email'], draft_data['customer_name'],
            draft_data['total'], draft_data.get('pdf_url'),
            draft_data.get('status', 'PENDING_APPROVAL'),
            draft_data.get('confidence'), draft_data.get('created_by')
        ))
        
        # Insert line items
        for item in line_items:
            item_id = str(uuid.uuid4())
            conn.execute("""
                INSERT INTO draft_line_items
                (id, draft_id, service_name, description, quantity, unit_price, 
                 unit, line_total, match_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item_id, draft_id, item['service_name'], item.get('description'),
                item['quantity'], item['unit_price'], item.get('unit', 'Each'),
                item['line_total'], item.get('match_score')
            ))
        
        conn.commit()
        conn.close()
        
        return draft_id
    
    def get_drafts(self, client_id: str, status: str = None) -> List[Dict[str, Any]]:
        """Get all drafts for a client."""
        conn = self.get_connection()
        
        if status:
            rows = conn.execute("""
                SELECT * FROM client_drafts 
                WHERE client_id = ? AND status = ?
                ORDER BY created_at DESC
            """, (client_id, status)).fetchall()
        else:
            rows = conn.execute("""
                SELECT * FROM client_drafts 
                WHERE client_id = ?
                ORDER BY created_at DESC
            """, (client_id,)).fetchall()
        
        drafts = [dict(row) for row in rows]
        
        # Load line items for each draft
        for draft in drafts:
            items = conn.execute("""
                SELECT * FROM draft_line_items WHERE draft_id = ?
            """, (draft['id'],)).fetchall()
            draft['line_items'] = [dict(item) for item in items]
        
        conn.close()
        return drafts
    
    def update_draft_status(self, draft_id: str, status: str, 
                           approved_by: str = None):
        """Update draft status (approve/reject)."""
        conn = self.get_connection()
        
        if approved_by:
            conn.execute("""
                UPDATE client_drafts 
                SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (status, approved_by, draft_id))
        else:
            conn.execute("""
                UPDATE client_drafts SET status = ? WHERE id = ?
            """, (status, draft_id))
        
        conn.commit()
        conn.close()
    
    # ============================================
    # Customer Operations
    # ============================================
    
    def get_or_create_customer(self, client_id: str, email: str, 
                               name: str, company: str = None) -> str:
        """Get existing customer or create new one."""
        conn = self.get_connection()
        
        # Try to find existing
        row = conn.execute("""
            SELECT id FROM customers 
            WHERE client_id = ? AND email = ?
        """, (client_id, email)).fetchone()
        
        if row:
            customer_id = row['id']
        else:
            # Create new
            customer_id = str(uuid.uuid4())
            conn.execute("""
                INSERT INTO customers (id, client_id, email, name, company)
                VALUES (?, ?, ?, ?, ?)
            """, (customer_id, client_id, email, name, company))
            conn.commit()
        
        conn.close()
        return customer_id
    
    # ============================================
    # Activity Log Operations
    # ============================================
    
    def log_activity(self, client_id: str, action: str, details: str,
                    user_id: str = None):
        """Log an activity for a client."""
        conn = self.get_connection()
        
        activity_id = str(uuid.uuid4())
        conn.execute("""
            INSERT INTO activity_log (id, client_id, action, details, user_id)
            VALUES (?, ?, ?, ?, ?)
        """, (activity_id, client_id, action, details, user_id))
        
        conn.commit()
        conn.close()
    
    def get_activity_log(self, client_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent activity for a client."""
        conn = self.get_connection()
        
        rows = conn.execute("""
            SELECT * FROM activity_log 
            WHERE client_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (client_id, limit)).fetchall()
        
        conn.close()
        return [dict(row) for row in rows]
