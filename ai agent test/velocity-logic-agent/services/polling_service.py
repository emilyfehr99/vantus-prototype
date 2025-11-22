"""
Polling Service - Background Email Monitoring
Checks Gmail inbox at regular intervals and processes new quote requests.
"""

import time
import threading
from datetime import datetime
from typing import Optional, Callable


class PollingService:
    """Background service for automatic email polling."""
    
    def __init__(self, check_interval: int = 60):
        """
        Initialize the polling service.
        
        Args:
            check_interval: Seconds between email checks (default 60)
        """
        self.check_interval = check_interval
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.last_poll_time: Optional[datetime] = None
        self.processed_message_ids = set()
        self.stats = {
            "total_polls": 0,
            "emails_processed": 0,
            "errors": 0
        }
    
    def start(self, gmail_service, agent, process_callback: Optional[Callable] = None):
        """
        Start the polling service in a background thread.
        
        Args:
            gmail_service: GmailService instance
            agent: VelocityLogicAgent instance
            process_callback: Optional callback function to call after processing each email
        """
        if self.is_running:
            print("⚠️  Polling service is already running")
            return
        
        self.is_running = True
        self.thread = threading.Thread(
            target=self._poll_loop,
            args=(gmail_service, agent, process_callback),
            daemon=True
        )
        self.thread.start()
        print(f"✓ Polling service started (checking every {self.check_interval}s)")
    
    def stop(self):
        """Stop the polling service."""
        if not self.is_running:
            print("⚠️  Polling service is not running")
            return
        
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=5)
        print("✓ Polling service stopped")
    
    def _poll_loop(self, gmail_service, agent, process_callback):
        """Main polling loop (runs in background thread)."""
        print(f"🔄 Email polling started (interval: {self.check_interval}s)")
        
        while self.is_running:
            try:
                self.stats["total_polls"] += 1
                self.last_poll_time = datetime.now()
                
                # Check for new emails
                messages = gmail_service.list_messages(query="is:unread")
                
                if not messages:
                    print(f"[{self.last_poll_time.strftime('%H:%M:%S')}] No new emails")
                else:
                    print(f"[{self.last_poll_time.strftime('%H:%M:%S')}] Found {len(messages)} unread email(s)")
                    
                    for msg_data in messages:
                        msg_id = msg_data.get('id')
                        
                        # Skip if already processed
                        if msg_id in self.processed_message_ids:
                            continue
                        
                        try:
                            # Get full message
                            message = gmail_service.get_message(msg_id)
                            from_email = self._extract_email(message.get('from', ''))
                            subject = message.get('subject', 'No Subject')
                            body = message.get('body', '')
                            thread_id = message.get('threadId')
                            
                            print(f"\n📧 Processing email from {from_email}")
                            print(f"   Subject: {subject}")
                            
                            # Process the email through agent
                            result = agent.process_email(
                                email_body=body,
                                from_email=from_email,
                                thread_id=thread_id
                            )
                            
                            if result and result.get('success'):
                                print(f"✓ Quote created: #{result['quote_number']}")
                                self.stats["emails_processed"] += 1
                                
                                # Mark as read
                                gmail_service.mark_as_read(msg_id)
                                
                                # Track as processed
                                self.processed_message_ids.add(msg_id)
                                
                                # Call callback if provided
                                if process_callback:
                                    process_callback(result)
                            else:
                                print(f"✗ Failed to create quote")
                                self.stats["errors"] += 1
                        
                        except Exception as e:
                            print(f"✗ Error processing message {msg_id}: {e}")
                            self.stats["errors"] += 1
                            continue
                
                # Wait before next poll
                time.sleep(self.check_interval)
            
            except Exception as e:
                print(f"✗ Error in polling loop: {e}")
                self.stats["errors"] += 1
                time.sleep(self.check_interval)  # Continue polling despite errors
    
    def _extract_email(self, from_field: str) -> str:
        """Extract email address from 'From' field."""
        if '<' in from_field and '>' in from_field:
            start = from_field.index('<') + 1
            end = from_field.index('>')
            return from_field[start:end]
        return from_field
    
    def get_status(self) -> dict:
        """Get current polling status."""
        return {
            "is_running": self.is_running,
            "check_interval": self.check_interval,
            "last_poll_time": self.last_poll_time.isoformat() if self.last_poll_time else None,
            "stats": self.stats
        }
