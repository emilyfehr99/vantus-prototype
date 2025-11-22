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
        """Load pricing data from CSV into DataFrame."""
        try:
            if not os.path.exists(self.pricing_csv_path):
                raise FileNotFoundError(
                    f"Pricing file not found: {self.pricing_csv_path}"
                )
            
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
        
        for idx, text in search_texts:
            # Use partial ratio for better matching of substrings
            score = max(
                fuzz.partial_ratio(service_request.lower(), text.lower()),
                fuzz.ratio(service_request.lower(), text.lower())
            )
            
            if score > best_score and score >= threshold:
                best_score = score
                best_match = idx
        
        if best_match is not None:
            matched_row = self.df.iloc[best_match].to_dict()
            matched_row["match_score"] = best_score
            return matched_row
        
        return None
    
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
            service_requested = item.get("service_requested", "").strip()
            quantity = item.get("quantity", 1)
            
            if not service_requested:
                continue
            
            # Try to match the service
            matched_service = self._fuzzy_match_service(service_requested)
            
            if matched_service:
                unit_price = float(matched_service.get("Unit Price", 0))
                line_total = unit_price * quantity
                
                line_item = {
                    "service_name": matched_service.get("Service Name", service_requested),
                    "description": matched_service.get("Description", ""),
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "unit": matched_service.get("Unit", "Each"),
                    "line_total": line_total,
                    "match_score": matched_service.get("match_score", 0)
                }
                
                line_items.append(line_item)
                subtotal += line_total
            else:
                # If no match found, add as unknown item with zero price
                print(f"⚠ Warning: Could not match service '{service_requested}'")
                line_item = {
                    "service_name": service_requested,
                    "description": "Service not found in pricing database",
                    "quantity": quantity,
                    "unit_price": 0.0,
                    "unit": "Each",
                    "line_total": 0.0,
                    "match_score": 0
                }
                line_items.append(line_item)
        
        tax = subtotal * tax_rate
        total = subtotal + tax
        
        return {
            "line_items": line_items,
            "subtotal": round(subtotal, 2),
            "tax": round(tax, 2),
            "tax_rate": tax_rate,
            "total": round(total, 2)
        }

