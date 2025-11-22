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
    
    def process_email(self, email_body: str, from_email: str, thread_id: Optional[str] = None) -> bool:
        """
        Process a single email through the full workflow.
        
        Args:
            email_body: The email body text
            from_email: Sender's email address
            thread_id: Optional Gmail thread ID
        
        Returns:
            True if successful, False otherwise
        """
        try:
            print(f"\n{'='*60}")
            print(f"📧 Processing email from: {from_email}")
            print(f"{'='*60}")
            
            # Step 1: Parse email intent with LLM
            print("\n[1/5] Parsing email intent...")
            parsed_data = self.llm_service.parse_email_intent(email_body)
            customer_name = parsed_data.get("customer_name", "Customer")
            extracted_items = parsed_data.get("extracted_items", [])
            
            print(f"   ✓ Customer: {customer_name}")
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
                quote_number=quote_number
            )
            print(f"   ✓ PDF generated: {pdf_path}")
            
            # Step 4: Create email body
            print("\n[4/5] Preparing email draft...")
            email_subject = f"Quote #{quote_number} - Velocity Logic"
            email_body = self._generate_email_body(customer_name, quote_data, quote_number)
            
            # Step 5: Create Gmail draft
            print("\n[5/5] Creating Gmail draft...")
            draft = self.gmail_service.create_draft(
                to_email=from_email,
                subject=email_subject,
                body=email_body,
                thread_id=thread_id,
                pdf_path=pdf_path
            )
            
            if draft:
                print(f"\n✅ Successfully processed email and created draft!")
                return True
            else:
                print(f"\n⚠ Draft creation may have failed (check logs)")
                return False
            
        except Exception as e:
            print(f"\n✗ Error processing email: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _generate_email_body(self, customer_name: str, quote_data: Dict[str, Any], quote_number: str) -> str:
        """Generate professional email body for the quote."""
        body = f"""Dear {customer_name},

Thank you for contacting Velocity Logic. We're pleased to provide you with the following quote:

Quote Number: {quote_number}

Services:
"""
        for item in quote_data["line_items"]:
            body += f"  • {item['service_name']} (Qty: {item['quantity']}) - ${item['line_total']:.2f}\n"
        
        body += f"""
Subtotal: ${quote_data['subtotal']:.2f}
Tax: ${quote_data['tax']:.2f}
Total: ${quote_data['total']:.2f}

A detailed quote has been attached to this email.

This quote is valid for 30 days from the date issued. If you have any questions or would like to proceed, please don't hesitate to contact us.

Best regards,
Velocity Logic Team
"""
        return body
    
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
                        
                        # Process the email
                        if self.process_email(email_body, from_email, thread_id):
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

