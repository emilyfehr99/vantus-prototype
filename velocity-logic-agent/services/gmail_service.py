"""
Gmail Service
Handles Gmail API authentication and draft creation.
"""

import os
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, Dict, Any
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import pickle


class GmailService:
    """Manages Gmail API interactions."""
    
    # Gmail API scopes
    SCOPES = ['https://www.googleapis.com/auth/gmail.compose']
    
    def __init__(self, credentials_path: str = "credentials.json", token_path: str = "token.pickle"):
        """
        Initialize Gmail service.
        
        Args:
            credentials_path: Path to Google OAuth credentials JSON
            token_path: Path to save/load OAuth token
        """
        self.credentials_path = credentials_path
        self.token_path = token_path
        self.service = None
        self.mock_mode = False
        
        if not os.path.exists(credentials_path):
            print("⚠ Warning: Google Cloud Credentials not found. Running in Mock Mode (simulated email).")
            self.mock_mode = True
        else:
            self.authenticate_gmail()
    
    def authenticate_gmail(self) -> None:
        """Authenticate with Gmail API using OAuth2."""
        if self.mock_mode:
            return
        
        creds = None
        
        # Load existing token
        if os.path.exists(self.token_path):
            try:
                with open(self.token_path, 'rb') as token:
                    creds = pickle.load(token)
            except Exception as e:
                print(f"⚠ Error loading token: {e}")
        
        # If there are no (valid) credentials available, let the user log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    print(f"⚠ Error refreshing token: {e}")
                    creds = None
            
            if not creds:
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, self.SCOPES
                    )
                    creds = flow.run_local_server(port=0)
                except Exception as e:
                    print(f"✗ Error during OAuth flow: {e}")
                    print("⚠ Falling back to Mock Mode")
                    self.mock_mode = True
                    return
            
            # Save the credentials for the next run
            try:
                with open(self.token_path, 'wb') as token:
                    pickle.dump(creds, token)
            except Exception as e:
                print(f"⚠ Warning: Could not save token: {e}")
        
        try:
            self.service = build('gmail', 'v1', credentials=creds)
            print("✓ Gmail API authenticated successfully")
        except Exception as e:
            print(f"✗ Error building Gmail service: {e}")
            print("⚠ Falling back to Mock Mode")
            self.mock_mode = True
    
    def create_draft(
        self,
        to_email: str,
        subject: str,
        body: str,
        thread_id: Optional[str] = None,
        pdf_path: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a Gmail draft with optional PDF attachment.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body text
            thread_id: Optional thread ID to reply to
            pdf_path: Optional path to PDF file to attach
        
        Returns:
            Dictionary with draft info or None if in mock mode
        """
        if self.mock_mode:
            print(f"\n{'='*60}")
            print("📧 MOCK MODE - Email Draft (Not Sent)")
            print(f"{'='*60}")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            if thread_id:
                print(f"Thread ID: {thread_id}")
            print(f"\nBody:\n{body}")
            if pdf_path:
                print(f"\nAttachment: {pdf_path}")
            print(f"{'='*60}\n")
            return {
                "id": "mock_draft_id",
                "message": {"threadId": thread_id or "mock_thread_id"}
            }
        
        try:
            # Create message
            message = MIMEMultipart()
            message['to'] = to_email
            message['subject'] = subject
            
            # Add body
            message.attach(MIMEText(body, 'plain'))
            
            # Add PDF attachment if provided
            if pdf_path and os.path.exists(pdf_path):
                with open(pdf_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {os.path.basename(pdf_path)}'
                )
                message.attach(part)
            
            # Encode message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            # Create draft
            draft_body = {
                'message': {
                    'raw': raw_message
                }
            }
            
            # Add thread ID if replying
            if thread_id:
                draft_body['message']['threadId'] = thread_id
            
            draft = self.service.users().drafts().create(
                userId='me',
                body=draft_body
            ).execute()
            
            print(f"✓ Created Gmail draft: {draft['id']}")
            return draft
            
        except HttpError as error:
            print(f"✗ Gmail API error: {error}")
            return None
        except Exception as e:
            print(f"✗ Error creating draft: {e}")
            return None
    
    def get_message(self, message_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a Gmail message by ID.
        
        Args:
            message_id: Gmail message ID
        
        Returns:
            Message dictionary or None
        """
        if self.mock_mode:
            return None
        
        try:
            message = self.service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            return message
        except HttpError as error:
            print(f"✗ Error getting message: {error}")
            return None
    
    def list_messages(self, query: str = "is:unread", max_results: int = 10) -> list:
        """
        List Gmail messages matching a query.
        
        Args:
            query: Gmail search query
            max_results: Maximum number of results
        
        Returns:
            List of message dictionaries
        """
        if self.mock_mode:
            print(f"📧 MOCK MODE - Would search for: {query}")
            return []
        
        try:
            results = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            return messages
        except HttpError as error:
            print(f"✗ Error listing messages: {error}")
            return []
    
    def get_message_body(self, message: Dict[str, Any]) -> str:
        """
        Extract plain text body from a Gmail message.
        
        Args:
            message: Gmail message dictionary
        
        Returns:
            Plain text body
        """
        if self.mock_mode:
            return "Mock email body"
        
        try:
            payload = message.get('payload', {})
            parts = payload.get('parts', [])
            
            # Try to find plain text part
            for part in parts:
                if part.get('mimeType') == 'text/plain':
                    data = part.get('body', {}).get('data')
                    if data:
                        return base64.urlsafe_b64decode(data).decode('utf-8')
            
            # If no plain text part, try the body directly
            body = payload.get('body', {})
            data = body.get('data')
            if data:
                return base64.urlsafe_b64decode(data).decode('utf-8')
            
            return ""
        except Exception as e:
            print(f"✗ Error extracting message body: {e}")
            return ""

