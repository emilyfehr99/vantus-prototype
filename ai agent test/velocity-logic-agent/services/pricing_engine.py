"""
Pricing Engine Service
Handles loading pricing data and calculating quotes with fuzzy matching.
"""

import pandas as pd
import os
from typing import Dict, List, Any
from thefuzz import fuzz, process


class PricingEngine:
    """Manages pricing data and calculates quotes."""
    
    def __init__(self, pricing_csv_path: str = "data/pricing.csv"):
        """
        Initialize the pricing engine.
        
        Args:
            pricing_csv_path: Path to the pricing CSV file
        """
        self.pricing_csv_path = pricing_csv_path
        self.df = None
        self.load_pricing_data()
    
    def load_pricing_data(self) -> None:
        """Load pricing data from CSV or Excel into DataFrame."""
        try:
            if not os.path.exists(self.pricing_csv_path):
                raise FileNotFoundError(
                    f"Pricing file not found: {self.pricing_csv_path}"
                )
            
            # Determine file type
            _, ext = os.path.splitext(self.pricing_csv_path)
            ext = ext.lower()
            
            if ext in ['.xlsx', '.xls']:
                self.df = pd.read_excel(self.pricing_csv_path)
            else:
                self.df = pd.read_csv(self.pricing_csv_path)
            
            # Validate required columns
            required_columns = ["Service Name", "Unit Price"]
            missing_columns = [col for col in required_columns if col not in self.df.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
            
            # Convert Unit Price to float
            self.df["Unit Price"] = pd.to_numeric(self.df["Unit Price"], errors="coerce")
            
            print(f"✓ Loaded {len(self.df)} pricing items from {self.pricing_csv_path}")
            
        except Exception as e:
            print(f"✗ Error loading pricing data: {e}")
            raise
    
    def load_from_google_sheets(self, sheets_service, spreadsheet_url: str) -> None:
        """
        Load pricing data from Google Sheets.
        
        Args:
            sheets_service: Instance of SheetsService
            spreadsheet_url: URL of the Google Sheet
        """
        try:
            pricing_data = sheets_service.read_pricing_data(spreadsheet_url)
            
            if not pricing_data:
                raise ValueError("No pricing data found in Google Sheet")
            
            # Convert to DataFrame
            self.df = pd.DataFrame(pricing_data)
            
            # Rename columns to match expected format
            self.df.rename(columns={
                'service_name': 'Service Name',
                'unit_price': 'Unit Price',
                'unit': 'Unit'
            }, inplace=True)
            
            # Convert Unit Price to float
            self.df["Unit Price"] = pd.to_numeric(self.df["Unit Price"], errors="coerce")
            
            print(f"✓ Loaded {len(self.df)} pricing items from Google Sheets")
            
        except Exception as e:
            print(f"✗ Error loading pricing data from Google Sheets: {e}")
            raise
    
    def _fuzzy_match_service(self, service_request: str, threshold: int = 60) -> Dict[str, Any]:
        """
        Find the best matching service using fuzzy string matching.
        
        Args:
            service_request: The service name requested by the customer
            threshold: Minimum similarity score (0-100)
        
        Returns:
            Dictionary with matched service row or None
        """
        if self.df is None or len(self.df) == 0:
            return None
        
        # Combine Service Name and Keywords for matching
        search_texts = []
        for idx, row in self.df.iterrows():
            # Combine service name and keywords
            searchable_text = str(row.get("Service Name", ""))
            if pd.notna(row.get("Keywords")):
                searchable_text += " " + str(row.get("Keywords", ""))
            search_texts.append((idx, searchable_text))
        
        # Find best match
        best_match = None
        best_score = 0
        best_idx = None
        
        for idx, text in search_texts:
            # Use partial ratio for better matching of substrings
            score = max(
                fuzz.ratio(service_request.lower(), text.lower()),
                fuzz.partial_ratio(service_request.lower(), text.lower()),
                fuzz.token_sort_ratio(service_request.lower(), text.lower())
            )
            
            if score > best_score:
                best_score = score
                best_idx = idx
        
        # Return best match if above threshold
        if best_score >= threshold and best_idx is not None:
            matched_row = self.df.loc[best_idx].to_dict()
            matched_row['match_score'] = best_score  # Add match score to result
            return matched_row
        
        return None  # No match found
    
    def calculate_quote(self, extracted_items: List[Dict[str, Any]], tax_rate: float = 0.10) -> Dict[str, Any]:
        """
        Calculate quote from extracted items.
        
        Args:
            extracted_items: List of dicts with 'service_requested' and 'quantity' keys
            tax_rate: Tax rate as decimal (default 10%)
        
        Returns:
            Dictionary with line_items, subtotal, tax, and total
        """
        if self.df is None:
            raise ValueError("Pricing data not loaded")
        
        line_items = []
        subtotal = 0.0
        
        for item in extracted_items:
            service_request = item.get("service_requested", "")
            quantity = int(item.get("quantity", 1))
            
            if not service_request:
                continue
            
            # Find matching service in pricing data
            matched_service = self._fuzzy_match_service(service_request)
            
            if matched_service:
                service_name = matched_service.get("Service Name", service_request)
                unit_price = float(matched_service.get("Unit Price", 0))
                unit = matched_service.get("Unit", "Each")
                description = matched_service.get("Description", "")
                match_score = matched_service.get("match_score", 0)  # Get match score
                
                line_total = unit_price * quantity
                
                line_items.append({
                    "service_name": service_name,
                    "description": description,
                    "unit_price": unit_price,
                    "quantity": quantity,
                    "unit": unit,
                    "line_total": line_total,
                    "match_score": match_score  # Include match score in line item
                })
                
                subtotal += line_total
            else:
                # No match found - add with warning
                print(f"   ⚠ No pricing match for: {service_request}")
                line_items.append({
                    "service_name": service_request,
                    "description": "Service not found in pricing database",
                    "unit_price": 0.0,
                    "quantity": quantity,
                    "unit": "Each",
                    "line_total": 0.0,
                    "match_score": 0  # No match = 0 score
                })
        
        tax = subtotal * tax_rate
        total = subtotal + tax
        
        return {
            "line_items": line_items,
            "subtotal": round(subtotal, 2),
            "tax": round(tax, 2),
            "tax_rate": tax_rate,
            "total": round(total, 2)
        }

