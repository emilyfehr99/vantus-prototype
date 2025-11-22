"""
Migration Script: Single-Client to Multi-Tenant
Converts existing drafts.json and settings.json to multi-tenant database.
"""

import json
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_manager import DatabaseManager
from database.auth_service import AuthService


def migrate_to_multitenant():
    """Migrate existing single-client data to multi-tenant database."""
    
    print("=" * 60)
    print("🔄 Migrating to Multi-Tenant Architecture")
    print("=" * 60)
    
    # Initialize database
    db = DatabaseManager()
    
    # Step 1: Create default client
    print("\n[1/4] Creating default client...")
    client_id = db.create_client(
        company_name="Demo Company",
        industry="hvac",
        subscription_tier="free"
    )
    print(f"   ✓ Client created: {client_id}")
    
    # Step 2: Create default owner user
    print("\n[2/4] Creating default user...")
    password_hash = AuthService.hash_password("changeme123")  # Default password
    user_id = db.create_user(
        client_id=client_id,
        email="demo@velocitylogic.com",
        password_hash=password_hash,
        full_name="Demo User",
        role="owner"
    )
    print(f"   ✓ User created: demo@velocitylogic.com")
    print(f"   ⚠️  Default password: changeme123")
    print(f"   🔐 Please change this password after first login!")
    
    # Step 3: Migrate existing drafts
    print("\n[3/4] Migrating existing drafts...")
    drafts_file = 'drafts.json'
    
    if os.path.exists(drafts_file):
        with open(drafts_file, 'r') as f:
            old_drafts = json.load(f)
        
        for draft in old_drafts:
            # Prepare draft data
            draft_data = {
                'id': draft.get('id'),
                'quote_number': draft['quote_number'],
                'customer_email': draft['customer_email'],
                'customer_name': draft['customer_name'],
                'total': draft['total'],
                'pdf_url': draft.get('pdf_url'),
                'status': draft.get('status', 'PENDING_APPROVAL'),
                'confidence': draft.get('confidence'),
                'created_by': user_id
            }
            
            # Get line items
            line_items = draft.get('line_items', [])
            
            # Create draft in database
            db.create_draft(client_id, draft_data, line_items)
        
        print(f"   ✓ Migrated {len(old_drafts)} draft(s)")
        
        # Backup old file
        backup_path = f"{drafts_file}.backup"
        os.rename(drafts_file, backup_path)
        print(f"   ✓ Backed up to: {backup_path}")
    else:
        print("   ℹ️  No existing drafts found")
    
    # Step 4: Migrate existing settings
    print("\n[4/4] Migrating existing settings...")
    settings_file = 'settings.json'
    
    if os.path.exists(settings_file):
        with open(settings_file, 'r') as f:
            old_settings = json.load(f)
        
        # Map old settings to new schema
        new_settings = {
            'company_tagline': old_settings.get('company_tagline'),
            'company_address': old_settings.get('company_address'),
            'company_phone': old_settings.get('company_phone'),
            'company_email': old_settings.get('company_email'),
            'company_website': old_settings.get('company_website'),
            'logo_path': old_settings.get('logo_path'),
            'primary_color': old_settings.get('primary_color'),
            'secondary_color': old_settings.get('secondary_color')
        }
        
        # Remove None values
        new_settings = {k: v for k, v in new_settings.items() if v is not None}
        
        # Update client settings
        db.update_client_settings(client_id, new_settings)
        
        # Update client company name if it was in settings
        if 'company_name' in old_settings:
            conn = db.get_connection()
            conn.execute(
                "UPDATE clients SET company_name = ? WHERE id = ?",
                (old_settings['company_name'], client_id)
            )
            conn.commit()
            conn.close()
        
        print("   ✓ Settings migrated")
        
        # Backup old file
        backup_path = f"{settings_file}.backup"
        os.rename(settings_file, backup_path)
        print(f"   ✓ Backed up to: {backup_path}")
    else:
        print("   ℹ️  No existing settings found")
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ Migration Complete!")
    print("=" * 60)
    print(f"\n📋 Migration Summary:")
    print(f"   Client ID: {client_id}")
    print(f"   User ID: {user_id}")
    print(f"   Email: demo@velocitylogic.com")
    print(f"   Password: changeme123")
    print(f"\n🔐 IMPORTANT: Change the default password immediately!")
    print(f"\n📌 Next Steps:")
    print(f"   1. Restart the backend server")
    print(f"   2. Login with demo@velocitylogic.com / changeme123")
    print(f"   3. Change password in Settings")
    print("=" * 60)
    
    return client_id, user_id


if __name__ == '__main__':
    try:
        migrate_to_multitenant()
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
