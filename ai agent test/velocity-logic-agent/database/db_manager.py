"""
Database Manager for Multi-Tenant Velocity Logic Agent
Handles all database operations with Supabase (PostgreSQL).
"""

import os
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

class DatabaseManager:
    """Manages Supabase database operations for multi-tenant system."""
    
    def __init__(self):
        """Initialize Supabase client."""
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")
            
        self.supabase: Client = create_client(url, key)
        print("✓ Connected to Supabase")
    
    def get_connection(self):
        """Not used in Supabase implementation, kept for compatibility if needed."""
        return None
    
    # ============================================
    # Client Operations
    # ============================================
    
    def create_client(self, company_name: str, industry: str = None, 
                     subscription_tier: str = 'free') -> str:
        """Create a new client (business)."""
        client_id = str(uuid.uuid4())
        
        # Insert client
        self.supabase.table("clients").insert({
            "id": client_id,
            "company_name": company_name,
            "industry": industry,
            "subscription_tier": subscription_tier
        }).execute()
        
        # Create default settings
        self.supabase.table("client_settings").insert({
            "client_id": client_id
        }).execute()
        
        return client_id
    
    def get_client(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get client by ID."""
        response = self.supabase.table("clients").select("*").eq("id", client_id).execute()
        return response.data[0] if response.data else None
    
    # ============================================
    # User Operations
    # ============================================
    
    def create_user(self, client_id: str, email: str, password_hash: str,
                   full_name: str = None, role: str = 'user') -> str:
        """Create a new user."""
        user_id = str(uuid.uuid4())
        
        self.supabase.table("users").insert({
            "id": user_id,
            "client_id": client_id,
            "email": email,
            "password_hash": password_hash,
            "full_name": full_name,
            "role": role
        }).execute()
        
        return user_id
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email."""
        response = self.supabase.table("users").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID."""
        response = self.supabase.table("users").select("*").eq("id", user_id).execute()
        return response.data[0] if response.data else None
    
    def update_last_login(self, user_id: str):
        """Update user's last login timestamp."""
        self.supabase.table("users").update({
            "last_login": datetime.now().isoformat()
        }).eq("id", user_id).execute()
    
    # ============================================
    # Settings Operations
    # ============================================
    
    def get_client_settings(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get settings for a client."""
        response = self.supabase.table("client_settings").select("*").eq("client_id", client_id).execute()
        return response.data[0] if response.data else None
    
    def update_client_settings(self, client_id: str, settings: Dict[str, Any]):
        """Update client settings."""
        # Remove client_id from settings if present to avoid PK update error
        update_data = {k: v for k, v in settings.items() if k != 'client_id'}
        
        if update_data:
            self.supabase.table("client_settings").update(update_data).eq("client_id", client_id).execute()
    
    # ============================================
    # Draft Operations
    # ============================================
    
    def create_draft(self, client_id: str, draft_data: Dict[str, Any], 
                    line_items: List[Dict[str, Any]]) -> str:
        """Create a new draft with line items."""
        draft_id = draft_data.get('id', str(uuid.uuid4()))
        
        # Prepare draft data
        insert_data = {
            "id": draft_id,
            "client_id": client_id,
            "quote_number": draft_data['quote_number'],
            "customer_email": draft_data['customer_email'],
            "customer_name": draft_data['customer_name'],
            "total": draft_data['total'],
            "pdf_url": draft_data.get('pdf_url'),
            "status": draft_data.get('status', 'PENDING_APPROVAL'),
            "confidence": draft_data.get('confidence'),
            "created_by": draft_data.get('created_by'),
            "email_thread_id": draft_data.get('email_thread_id'),
            "in_reply_to": draft_data.get('in_reply_to'),
            "email_received_at": draft_data.get('email_received_at'),
            "quote_sent_at": draft_data.get('quote_sent_at'),
            "clarifying_questions": draft_data.get('clarifying_questions'),
            "attention_reason": draft_data.get('attention_reason')
        }
        
        # Insert draft
        self.supabase.table("client_drafts").insert(insert_data).execute()
        
        # Insert line items
        if line_items:
            items_to_insert = []
            for item in line_items:
                items_to_insert.append({
                    "id": str(uuid.uuid4()),
                    "draft_id": draft_id,
                    "service_name": item['service_name'],
                    "description": item.get('description'),
                    "quantity": item['quantity'],
                    "unit_price": item['unit_price'],
                    "unit": item.get('unit', 'Each'),
                    "line_total": item['line_total'],
                    "match_score": item.get('match_score')
                })
            
            self.supabase.table("draft_line_items").insert(items_to_insert).execute()
        
        return draft_id
    
    def get_drafts(self, client_id: str, status: str = None) -> List[Dict[str, Any]]:
        """Get all drafts for a client."""
        query = self.supabase.table("client_drafts").select("*").eq("client_id", client_id)
        
        if status:
            query = query.eq("status", status)
            
        response = query.order("created_at", desc=True).execute()
        drafts = response.data
        
        # Load line items for each draft
        # Note: In a real production app, we might want to do this more efficiently
        # or only load line items when fetching a single draft
        for draft in drafts:
            items_response = self.supabase.table("draft_line_items").select("*").eq("draft_id", draft['id']).execute()
            draft['line_items'] = items_response.data
            
        return drafts
    
    def update_draft_status(self, draft_id: str, status: str, 
                           approved_by: str = None):
        """Update draft status (approve/reject)."""
        update_data = {"status": status}
        
        if approved_by:
            update_data["approved_by"] = approved_by
            update_data["approved_at"] = datetime.now().isoformat()
            
        self.supabase.table("client_drafts").update(update_data).eq("id", draft_id).execute()
    
    # ============================================
    # Customer Operations
    # ============================================
    
    def get_or_create_customer(self, client_id: str, email: str, 
                               name: str, company: str = None) -> str:
        """Get existing customer or create new one."""
        # Try to find existing
        response = self.supabase.table("customers").select("id").eq("client_id", client_id).eq("email", email).execute()
        
        if response.data:
            return response.data[0]['id']
        else:
            # Create new
            # Let Supabase generate UUID if we don't provide one, or provide one
            # Ideally we let Supabase handle it, but we need the ID back
            # The insert call returns data
            insert_response = self.supabase.table("customers").insert({
                "client_id": client_id,
                "email": email,
                "name": name,
                "company": company
            }).execute()
            
            return insert_response.data[0]['id']
    
    # ============================================
    # Activity Log Operations
    # ============================================
    
    def log_activity(self, client_id: str, action: str, details: str,
                    user_id: str = None):
        """Log an activity for a client."""
        self.supabase.table("activity_log").insert({
            "client_id": client_id,
            "action": action,
            "details": details,
            "user_id": user_id
        }).execute()
    
    def get_activity_log(self, client_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent activity for a client."""
        response = self.supabase.table("activity_log")\
            .select("*")\
            .eq("client_id", client_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
            
        return response.data
