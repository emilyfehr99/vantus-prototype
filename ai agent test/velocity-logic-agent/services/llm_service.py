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
        system_prompt = """You are an intelligent estimating assistant for blue-collar businesses across all trades (construction, electrical, plumbing, HVAC, auto parts, landscaping, etc.).

Your job is to extract key information from customer quote requests and match them to the business's service catalog.

Return a JSON object with the following structure:
{
    "customer_name": "Customer's name if mentioned, otherwise 'Customer'",
    "service_requested": "The main service or product requested (be as specific as possible based on the email)",
    "quantity": 1,
    "confidence": 95
}

If multiple services/items are requested, return an array:
{
    "customer_name": "Customer's name",
    "confidence": 90,
    "items": [
        {
            "service_requested": "Service/Product 1",
            "quantity": 1
        },
        {
            "service_requested": "Service/Product 2",
            "quantity": 2
        }
    ]
}

CONFIDENCE SCORING (0-100):
- **95-100**: Extremely clear request with specific details (e.g., "I need 3 GFCI outlets installed in bathrooms")
- **80-94**: Clear request with minor ambiguity (e.g., "Need new furnace")
- **60-79**: Somewhat vague but interpretable (e.g., "AC not working")
- **40-59**: Very vague, multiple interpretations possible (e.g., "Need help with my house")
- **0-39**: Cannot confidently extract meaningful information

EXTRACTION RULES:
1. **Be Specific**: Extract exact product names, model numbers, or service types when mentioned
2. **Preserve Industry Terms**: Keep technical terms (e.g., "2x4 lumber", "200-amp panel", "R-13 insulation")
3. **Extract Quantities**: Look for numbers, counts, measurements (e.g., "10 sheets", "500 sq ft", "3 units")
4. **Default to 1**: If no quantity mentioned, assume 1
5. **Multiple Items**: If customer lists multiple items, create separate entries
6. **Be Conservative**: If the request is vague, use general terms like "Consultation", "Quote Request", or "Service Call"
7. **Lower Confidence**: If you're unsure, reduce confidence score accordingly

COMMON PATTERNS:
- Construction: "lumber", "concrete", "framing", "drywall", "roofing materials"
- Electrical: "panel upgrade", "wiring", "outlet installation", "lighting"
- Plumbing: "water heater", "pipe repair", "fixture installation"
- HVAC: "furnace", "AC unit", "ductwork", "thermostat"
- Auto Parts: "brake pads", "oil filter", "battery", "alternator"
- Landscaping: "mulch", "pavers", "tree trimming", "lawn care"

Extract the service/product name EXACTLY as the customer describes it. The system will use fuzzy matching to find it in the pricing database.

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
            
            # Extract confidence score (default to 50 if not provided)
            confidence = parsed_data.get("confidence", 50)
            
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
                "extracted_items": extracted_items,
                "confidence": confidence  # Add confidence to return value
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

