"""
LLM Service
Handles OpenAI API interactions for parsing email intent.
"""

import os
from typing import Dict, Any, List
from openai import OpenAI
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()


class LLMService:
    """Manages OpenAI API interactions for email parsing."""
    
    def __init__(self):
        """Initialize the LLM service with API key from environment."""
        api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY not found in environment variables. "
                "Please set it in your .env file."
            )
        
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o"  # Can fallback to gpt-3.5-turbo if needed
    
    def parse_email_intent(self, email_body: str) -> Dict[str, Any]:
        """
        Parse email body to extract customer intent using OpenAI.
        
        Args:
            email_body: The email body text to parse
        
        Returns:
            Dictionary with customer_name, service_requested, and quantity
        """
        system_prompt = """You are an HVAC estimator assistant. Your job is to extract key information from customer emails.

Return a JSON object with the following structure:
{
    "customer_name": "Customer's name if mentioned, otherwise 'Customer'",
    "service_requested": "The main service or product requested (e.g., 'Furnace Installation', 'AC Repair', 'Service Call')",
    "quantity": 1
}

If multiple services are requested, return an array of items:
{
    "customer_name": "Customer's name",
    "items": [
        {
            "service_requested": "Service 1",
            "quantity": 1
        },
        {
            "service_requested": "Service 2",
            "quantity": 1
        }
    ]
}

Be specific with service names. Common services include:
- Furnace Installation
- AC Installation
- Service Call
- Furnace Repair
- AC Repair
- Ductwork Installation
- Thermostat Installation
- Air Filter Replacement
- Refrigerant Recharge
- Emergency Service

Always return valid JSON only, no additional text."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Parse this email:\n\n{email_body}"}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            parsed_data = json.loads(content)
            
            # Normalize the response format
            if "items" in parsed_data:
                # Multiple items format
                extracted_items = parsed_data["items"]
                customer_name = parsed_data.get("customer_name", "Customer")
            else:
                # Single item format - convert to items array
                extracted_items = [{
                    "service_requested": parsed_data.get("service_requested", ""),
                    "quantity": parsed_data.get("quantity", 1)
                }]
                customer_name = parsed_data.get("customer_name", "Customer")
            
            return {
                "customer_name": customer_name,
                "extracted_items": extracted_items
            }
            
        except json.JSONDecodeError as e:
            print(f"✗ Error parsing JSON response: {e}")
            print(f"Response content: {content}")
            # Return default structure
            return {
                "customer_name": "Customer",
                "extracted_items": [{
                    "service_requested": "Service Call",
                    "quantity": 1
                }]
            }
        
        except Exception as e:
            print(f"✗ Error calling OpenAI API: {e}")
            # Return default structure on error
            return {
                "customer_name": "Customer",
                "extracted_items": [{
                    "service_requested": "Service Call",
                    "quantity": 1
                }]
            }

