"""
Velocity Logic - Main Agent
Orchestrates the automated quoting workflow.
"""

import os
import time
import sys
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Import services
from services.llm_service import LLMService
from services.pricing_engine import PricingEngine
from services.pdf_service import PDFService
from services.gmail_service import GmailService
from database.db_manager import DatabaseManager

# Load environment variables
load_dotenv()


class VelocityLogicAgent:
    """Main agent orchestrating the quoting workflow."""
    
    def __init__(self):
        """Initialize all services."""
        print("=" * 60)
        print("🚀 Velocity Logic Agent - Starting Up")
        print("=" * 60)
        
        try:
            self.db = DatabaseManager()
            print("✓ Database Manager initialized")
            
            # Get default client (for single-tenant mode)
            # Get default client (for single-tenant mode)
            # In Supabase, we can just fetch the first client
            response = self.db.supabase.table("clients").select("id").limit(1).execute()
            if response.data:
                self.client_id = response.data[0]['id']
                print(f"✓ Using Client ID: {self.client_id}")
            else:
                print("⚠ No clients found in database. Please run migration or create a client.")
                self.client_id = None
            
        except Exception as e:
            print(f"✗ Failed to initialize Database: {e}")
            sys.exit(1)

        try:
            self.llm_service = LLMService()
            print("✓ LLM Service initialized")
        except Exception as e:
            print(f"✗ Failed to initialize LLM Service: {e}")
            sys.exit(1)
        
        try:
            self.pricing_engine = PricingEngine()
            print("✓ Pricing Engine initialized")
        except Exception as e:
            print(f"✗ Failed to initialize Pricing Engine: {e}")
            sys.exit(1)
        
        try:
            self.pdf_service = PDFService()
            print("✓ PDF Service initialized")
        except Exception as e:
            print(f"✗ Failed to initialize PDF Service: {e}")
            sys.exit(1)
        
        try:
            self.gmail_service = GmailService()
            print("✓ Gmail Service initialized")
        except Exception as e:
            print(f"✗ Failed to initialize Gmail Service: {e}")
            # Don't exit - can run in mock mode
        
        print("=" * 60)
        print("✓ All services initialized successfully")
        print("=" * 60)
    
    def process_email(self, email_body: str, from_email: str, thread_id: Optional[str] = None, company_info: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Process a single email through the full workflow.
        
        Args:
            email_body: The email body text
            from_email: Sender's email address
            thread_id: Optional Gmail thread ID
            company_info: Optional company branding info for PDF
        
        Returns:
            Dictionary with quote details if successful, None otherwise
        """
        try:
            print(f"\n{'='*60}")
            print(f"📧 Processing email from: {from_email}")
            print(f"{'='*60}")
            
            # Get auto-send preference
            auto_send_enabled = company_info.get('auto_send_enabled', 0) if company_info else 0
            company_name = company_info.get('company_name', 'Velocity Logic') if company_info else 'Velocity Logic'
            
            # Step 1: Parse email intent with LLM
            print("\n[1/5] Parsing email intent...")
            parsed_data = self.llm_service.parse_email_intent(email_body)
            customer_name = parsed_data.get("customer_name", "Customer")
            extracted_items = parsed_data.get("extracted_items", [])
            confidence = parsed_data.get("confidence", 50)
            needs_clarification = parsed_data.get("needs_clarification", False)
            clarifying_questions = parsed_data.get("clarifying_questions", [])
            requires_human_attention = parsed_data.get("requires_human_attention", False)
            human_attention_reason = parsed_data.get("human_attention_reason", "")
            
            print(f"   ✓ Customer: {customer_name}")
            print(f"   ✓ Confidence: {confidence}% {'✅' if confidence >= 80 else '⚠️' if confidence >= 60 else '❌'}")
            
            if requires_human_attention:
                print(f"   ✋ HUMAN ATTENTION REQUIRED: {human_attention_reason}")
                # Disable auto-send for this specific email
                auto_send_enabled = False
                print(f"   🚫 Auto-send OVERRIDDEN (blocked) due to human attention flag")
            
            # Handle Clarification Needed
            if needs_clarification:
                print(f"   ⚠ Request needs clarification. Questions generated: {len(clarifying_questions)}")
                
                # Generate clarification email
                email_body = self.llm_service.generate_clarification_email(customer_name, clarifying_questions, company_name)
                email_subject = f"Questions regarding your quote request - {company_name}"
                
                if auto_send_enabled:
                    print(f"   🚀 Auto-send ENABLED: Sending clarification email...")
                    sent_msg = self.gmail_service.send_email(
                        to_email=from_email,
                        subject=email_subject,
                        body=email_body,
                        thread_id=thread_id
                    )
                    if sent_msg:
                        print(f"   ✓ Clarification email sent!")
                        return {
                            "success": True,
                            "status": "NEEDS_CLARIFICATION",
                            "action": "EMAIL_SENT",
                            "clarifying_questions": clarifying_questions
                        }
                else:
                    print(f"   📝 Auto-send DISABLED: Creating draft with questions...")
                    draft = self.gmail_service.create_draft(
                        to_email=from_email,
                        subject=email_subject,
                        body=email_body,
                        thread_id=thread_id
                    )
                    if draft:
                        print(f"   ✓ Draft created with questions!")
                        return {
                            "success": True,
                            "status": "NEEDS_CLARIFICATION",
                            "action": "DRAFT_CREATED",
                            "draft_id": draft.get('id'),
                            "clarifying_questions": clarifying_questions
                        }
                return None

            print(f"   ✓ Services requested: {len(extracted_items)}")
            for item in extracted_items:
                print(f"      - {item.get('service_requested')} (Qty: {item.get('quantity', 1)})")
            
            # Step 2: Calculate quote
            print("\n[2/5] Calculating quote...")
            quote_data = self.pricing_engine.calculate_quote(extracted_items)
            print(f"   ✓ Subtotal: ${quote_data['subtotal']:.2f}")
            print(f"   ✓ Tax: ${quote_data['tax']:.2f}")
            print(f"   ✓ Total: ${quote_data['total']:.2f}")
            
            # Step 3: Generate PDF
            print("\n[3/5] Generating PDF quote...")
            quote_number = f"QT-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            pdf_path = self.pdf_service.generate_quote_pdf(
                customer_name=customer_name,
                quote_data=quote_data,
                quote_number=quote_number,
                company_info=company_info
            )
            print(f"   ✓ PDF generated: {pdf_path}")
            
            # Store company info for template access
            self._current_company_info = company_info
            
            # Step 4: Generate email body with custom template
            print("\n[4/5] Generating email body...")
            email_template = company_info.get('email_template') if company_info else None
            email_subject = f"Quote #{quote_number} - {company_name}"
            email_body = self._generate_email_body(customer_name, quote_data, quote_number, email_template)
            
            # Step 5: Create Draft or Auto-Send
            print("\n[5/5] Finalizing response...")
            
            # Auto-send logic: Enabled AND High Confidence (>90)
            should_auto_send = auto_send_enabled and confidence >= 90
            
            if should_auto_send:
                print(f"   🚀 Auto-send ENABLED & High Confidence ({confidence}%): Sending quote...")
                sent_msg = self.gmail_service.send_email(
                    to_email=from_email,
                    subject=email_subject,
                    body=email_body,
                    thread_id=thread_id,
                    pdf_path=pdf_path
                )
                if sent_msg:
                    print(f"   ✓ Quote sent successfully!")
                    return {
                        "success": True,
                        "quote_number": quote_number,
                        "customer_name": customer_name,
                        "total": quote_data['total'],
                        "pdf_path": pdf_path,
                        "status": "SENT",
                        "email_body": email_body,
                        "line_items": quote_data['line_items'],
                        "confidence": confidence
                    }
            else:
                if auto_send_enabled:
                    print(f"   ⚠️ Auto-send ENABLED but Confidence too low ({confidence}% < 90%): Creating draft instead.")
                else:
                    print(f"   📝 Auto-send DISABLED: Creating draft...")
                
                draft = self.gmail_service.create_draft(
                    to_email=from_email,
                    subject=email_subject,
                    body=email_body,
                    thread_id=thread_id,
                    pdf_path=pdf_path
                )
                
                if draft:
                    print(f"   ✓ Draft created successfully!")
                    
                    # Save draft to database
                    if self.client_id:
                        try:
                            conn = self.db.get_connection()
                            
                            # Determine status
                            status = 'NEEDS_REVIEW' if requires_human_attention else 'DRAFT'
                            
                            conn.execute("""
                                INSERT INTO client_drafts (
                                    client_id, customer_name, customer_email, 
                                    service_type, total, status, 
                                    email_thread_id, in_reply_to, 
                                    email_received_at, attention_reason
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                self.client_id, 
                                customer_name, 
                                from_email, 
                                ", ".join([item['service_name'] for item in quote_data['line_items']]), 
                                quote_data['total'], 
                                status,
                                thread_id, 
                                None, # in_reply_to
                                datetime.now(),
                                human_attention_reason if requires_human_attention else None
                            ))
                            conn.commit()
                            conn.close()
                            print(f"   ✓ Draft saved to database with status: {status}")
                        except Exception as e:
                            print(f"   ⚠ Error saving draft to database: {e}")

                    return {
                        "success": True,
                        "quote_number": quote_number,
                        "customer_name": customer_name,
                        "total": quote_data['total'],
                        "pdf_path": pdf_path,
                        "draft_id": draft.get('id', 'mock_draft_id'),
                        "status": "DRAFT",
                        "email_body": email_body,
                        "line_items": quote_data['line_items'],
                        "confidence": confidence,
                        "requires_human_attention": requires_human_attention,
                        "human_attention_reason": human_attention_reason
                    }
            
            print(f"\n⚠ Failed to send or create draft")
            return None
            
        except Exception as e:
            print(f"\n✗ Error processing email: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _generate_email_body(self, customer_name: str, quote_data: Dict[str, Any], quote_number: str, template: str = None) -> str:
        """
        Generate professional email body for the quote.
        Supports custom templates with variable substitution.
        """
        # Default template if none provided
        if not template:
            template = """Dear {customer_name},

Thank you for contacting {company_name}. We're pleased to provide you with the following quote:

Quote Number: {quote_number}

Services:
{line_items}

Subtotal: ${subtotal}
Tax: ${tax}
Total: ${total}

A detailed quote has been attached to this email.

This quote is valid for 30 days from the date issued. If you have any questions or would like to proceed, please don't hesitate to contact us.

Best regards,
{company_name} Team"""
        
        # Build line items string
        line_items_text = ""
        for item in quote_data["line_items"]:
            line_items_text += f"  • {item['service_name']} (Qty: {item['quantity']}) - ${item['line_total']:.2f}\n"
        
        # Get company name from company_info or default
        company_name = "Your Company"
        if hasattr(self, '_current_company_info') and self._current_company_info:
            company_name = self._current_company_info.get('company_name', 'Your Company')
        
        # Substitute variables
        email_body = template.format(
            customer_name=customer_name,
            company_name=company_name,
            quote_number=quote_number,
            line_items=line_items_text.strip(),
            subtotal=f"{quote_data['subtotal']:.2f}",
            tax=f"{quote_data['tax']:.2f}",
            total=f"{quote_data['total']:.2f}"
        )
        
        return email_body
    
    def run_continuous(self, check_interval: int = 60):
        """
        Run the agent continuously, checking for new emails.
        
        Args:
            check_interval: Seconds between email checks
        """
        print(f"\n🔄 Starting continuous monitoring (checking every {check_interval} seconds)")
        print("Press Ctrl+C to stop\n")
        
        processed_message_ids = set()
        
        try:
            while True:
                print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Checking for new emails...")
                
                # Get unread messages
                messages = self.gmail_service.list_messages(
                    query="is:unread",
                    max_results=10
                )
                
                if not messages:
                    print("   No new unread messages")
                else:
                    print(f"   Found {len(messages)} unread message(s)")
                    
                    for msg in messages:
                        msg_id = msg['id']
                        
                        # Skip if already processed
                        if msg_id in processed_message_ids:
                            continue
                        
                        # Get full message
                        full_message = self.gmail_service.get_message(msg_id)
                        if not full_message:
                            continue
                        
                        # Extract email details
                        headers = full_message.get('payload', {}).get('headers', [])
                        from_email = next(
                            (h['value'] for h in headers if h['name'].lower() == 'from'),
                            'unknown@example.com'
                        )
                        thread_id = full_message.get('threadId')
                        
                        # Extract email body
                        email_body = self.gmail_service.get_message_body(full_message)
                        
                        # Fetch latest company info (settings might have changed)
                        company_info = None
                        if self.client_id:
                            try:
                                # We need a helper to get company info from DB
                                # Re-using logic from web_interface.py's get_company_info would be ideal
                                # For now, let's just query the tables directly
                                conn = self.db.get_connection()
                                
                                # Get client details
                                cursor = conn.execute("SELECT company_name FROM clients WHERE id = ?", (self.client_id,))
                                client_row = cursor.fetchone()
                                company_name = client_row[0] if client_row else "Velocity Logic"
                                
                                # Get settings
                                cursor = conn.execute("""
                                    SELECT logo_path, primary_color, secondary_color, email_template, 
                                           pricing_csv_path, tax_rate, auto_approve_threshold,
                                           company_tagline, company_address, company_phone, 
                                           company_email, company_website, auto_send_enabled
                                    FROM client_settings 
                                    WHERE client_id = ?
                                """, (self.client_id,))
                                settings_row = cursor.fetchone()
                                
                                if settings_row:
                                    company_info = {
                                        'company_name': company_name,
                                        'logo_path': settings_row[0],
                                        'primary_color': settings_row[1],
                                        'secondary_color': settings_row[2],
                                        'email_template': settings_row[3],
                                        'pricing_csv_path': settings_row[4],
                                        'tax_rate': settings_row[5],
                                        'auto_approve_threshold': settings_row[6],
                                        'company_tagline': settings_row[7],
                                        'company_address': settings_row[8],
                                        'company_phone': settings_row[9],
                                        'company_email': settings_row[10],
                                        'company_website': settings_row[11],
                                        'auto_send_enabled': settings_row[12]
                                    }
                                conn.close()
                            except Exception as e:
                                print(f"⚠ Error fetching company info: {e}")

                        # Process the email
                        if self.process_email(email_body, from_email, thread_id, company_info):
                            processed_message_ids.add(msg_id)
                            print(f"   ✓ Marked message {msg_id} as processed")
                
                # Wait before next check
                print(f"\n⏳ Waiting {check_interval} seconds until next check...")
                time.sleep(check_interval)
        
        except KeyboardInterrupt:
            print("\n\n🛑 Shutdown requested by user")
            print("👋 Velocity Logic Agent stopped")
            sys.exit(0)
        except Exception as e:
            print(f"\n✗ Fatal error in main loop: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


def main():
    """Main entry point."""
    agent = VelocityLogicAgent()
    
    # Check if running in test mode (process a single mock email)
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print("\n🧪 Running in test mode with sample email...")
        sample_email = """
        Hi, I need a new furnace installed at my home. 
        The old one broke down and it's getting cold. 
        Please send me a quote.
        
        Thanks,
        John Smith
        """
        agent.process_email(sample_email, "john.smith@example.com")
    else:
        # Run continuously
        agent.run_continuous(check_interval=60)


if __name__ == "__main__":
    main()

