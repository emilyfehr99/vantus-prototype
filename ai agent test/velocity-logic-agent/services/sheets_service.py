"""
Google Sheets Service
Handles Google Sheets API interactions for pricing data sync.
"""

import os
import pickle
from typing import List, Dict, Any
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Scopes required for Sheets API
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']


class SheetsService:
    """Manages Google Sheets API interactions for pricing data."""
    
    def __init__(self):
        """Initialize the Sheets service with OAuth credentials."""
        self.creds = None
        self.service = None
        self._authenticate()
    
    def _authenticate(self):
        """Authenticate with Google Sheets API using OAuth."""
        # Token file stores the user's access and refresh tokens
        token_path = 'token_sheets.pickle'
        
        if os.path.exists(token_path):
            with open(token_path, 'rb') as token:
                self.creds = pickle.load(token)
        
        # If there are no (valid) credentials available, let the user log in
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                if not os.path.exists('credentials.json'):
                    raise FileNotFoundError(
                        "credentials.json not found. Please download it from Google Cloud Console."
                    )
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json', SCOPES)
                self.creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open(token_path, 'wb') as token:
                pickle.dump(self.creds, token)
        
        self.service = build('sheets', 'v4', credentials=self.creds)
    
    def read_pricing_data(self, spreadsheet_url: str, range_name: str = 'Sheet1!A:C') -> List[Dict[str, Any]]:
        """
        Read pricing data from a Google Sheet.
        
        Args:
            spreadsheet_url: Full URL of the Google Sheet
            range_name: Range to read (default: 'Sheet1!A:C' for columns A-C)
        
        Returns:
            List of dictionaries with pricing data
        """
        try:
            # Extract spreadsheet ID from URL
            spreadsheet_id = self._extract_sheet_id(spreadsheet_url)
            
            # Call the Sheets API
            sheet = self.service.spreadsheets()
            result = sheet.values().get(
                spreadsheetId=spreadsheet_id,
                range=range_name
            ).execute()
            
            values = result.get('values', [])
            
            if not values:
                print('No data found in sheet.')
                return []
            
            # Assume first row is headers
            headers = values[0]
            pricing_data = []
            
            for row in values[1:]:  # Skip header row
                if len(row) >= 2:  # At minimum need service name and price
                    item = {
                        'service_name': row[0] if len(row) > 0 else '',
                        'unit_price': float(row[1]) if len(row) > 1 and row[1] else 0.0,
                        'unit': row[2] if len(row) > 2 else 'Each'
                    }
                    pricing_data.append(item)
            
            print(f"✓ Loaded {len(pricing_data)} pricing items from Google Sheets")
            return pricing_data
            
        except HttpError as error:
            print(f"✗ Error reading from Google Sheets: {error}")
            return []
        except Exception as e:
            print(f"✗ Unexpected error: {e}")
            return []
    
    def _extract_sheet_id(self, url: str) -> str:
        """
        Extract spreadsheet ID from Google Sheets URL.
        
        Args:
            url: Full Google Sheets URL
        
        Returns:
            Spreadsheet ID
        """
        # URL format: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit...
        if '/d/' in url:
            start = url.find('/d/') + 3
            end = url.find('/', start)
            if end == -1:
                end = len(url)
            return url[start:end]
        else:
            # Assume the URL is just the ID
            return url
    
    def test_connection(self, spreadsheet_url: str) -> bool:
        """
        Test connection to a Google Sheet.
        
        Args:
            spreadsheet_url: Full URL of the Google Sheet
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            spreadsheet_id = self._extract_sheet_id(spreadsheet_url)
            sheet = self.service.spreadsheets()
            result = sheet.get(spreadsheetId=spreadsheet_id).execute()
            print(f"✓ Successfully connected to sheet: {result.get('properties', {}).get('title', 'Unknown')}")
            return True
        except HttpError as error:
            print(f"✗ Connection test failed: {error}")
            return False
        except Exception as e:
            print(f"✗ Unexpected error during connection test: {e}")
            return False
