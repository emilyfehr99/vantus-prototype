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
        system_prompt = """You are an expert estimating assistant for blue-collar businesses across ALL trades. You have deep knowledge of construction, electrical, plumbing, HVAC, auto parts, landscaping, and general contracting.

Your job is to extract key information from customer quote requests and match them to the business's service catalog with high accuracy.

Return a JSON object with the following structure:
{
    "customer_name": "Customer's name if mentioned, otherwise 'Customer'",
    "service_requested": "The main service or product requested (be as specific as possible based on the email)",
    "quantity": 1,
    "confidence": 95,
    "needs_clarification": false,
    "clarifying_questions": []
}

If multiple services/items are requested, return an array:
{
    "customer_name": "Customer's name",
    "confidence": 90,
    "needs_clarification": false,
    "items": [
        {
            "service_requested": "Service/Product 1",
            "quantity": 1
        }
    ]
}

If the request is VAGUE (confidence < 60), set "needs_clarification": true and provide 2-3 specific questions to ask the customer:
{
    "customer_name": "Customer",
    "confidence": 40,
    "needs_clarification": true,
    "clarifying_questions": [
        "Could you specify the type of water heater you need (gas or electric)?",
        "Do you know the approximate size or capacity needed?"
    ],
    "items": []
}

CONFIDENCE SCORING (0-100):
- **95-100**: Extremely clear request with specific details (e.g., "I need 3 GFCI outlets installed in bathrooms")
- **80-94**: Clear request with minor ambiguity (e.g., "Need new furnace installed")
- **60-79**: Somewhat vague but interpretable (e.g., "AC not working, need repair")
- **40-59**: Very vague, multiple interpretations possible (e.g., "Need help with my house")
- **0-39**: Cannot confidently extract meaningful information

EXTRACTION RULES:
1. **Be Specific**: Extract exact product names, model numbers, or service types when mentioned
2. **Preserve Industry Terms**: Keep technical terms (e.g., "2x4 lumber", "200-amp panel", "R-13 insulation")
3. **Extract Quantities**: Look for numbers, counts, measurements (e.g., "10 sheets", "500 sq ft", "3 units")
4. **Understand Units**: Recognize standard industry units (see COMMON UNITS below)
5. **Default to 1**: If no quantity mentioned, assume 1
6. **Multiple Items**: If customer lists multiple items, create separate entries for each
7. **Be Conservative**: If the request is vague, use general terms like "Consultation", "Quote Request", or "Service Call"
8. **Context Matters**: Use surrounding context to disambiguate (e.g., "panel" in electrical context = "electrical panel")
9. **Clarify Vague Requests**: If you can't determine the service with >60% confidence, ask clarifying questions.

COMMON BLUE COLLAR TERMINOLOGY BY TRADE:

**ELECTRICAL:**
- Panel/Service: "panel upgrade", "200-amp service", "electrical panel", "breaker box"
- Outlets: "outlet", "receptacle", "GFCI", "AFCI", "220V outlet", "dedicated circuit"
- Lighting: "recessed lighting", "can lights", "chandelier", "LED retrofit", "exterior lighting"
- Wiring: "rewire", "romex", "conduit", "wire run", "circuit installation"
- Emergency: "no power", "breaker tripping", "electrical fire hazard"

**PLUMBING:**
- Water Heaters: "water heater", "tankless", "40-gallon", "50-gallon", "gas/electric water heater"
- Fixtures: "faucet", "toilet", "sink", "shower", "bathtub", "garbage disposal"
- Pipes: "pipe repair", "leak", "repiping", "PEX", "copper", "PVC", "drain cleaning"
- Emergency: "burst pipe", "sewer backup", "no hot water", "flooding"

**HVAC:**
- Units: "furnace", "AC unit", "heat pump", "mini-split", "central air", "boiler"
- Ductwork: "duct cleaning", "duct repair", "ductwork installation", "air sealing"
- Maintenance: "tune-up", "filter replacement", "freon recharge", "thermostat"
- Emergency: "no heat", "no cooling", "AC not working", "furnace out"

**CONSTRUCTION/GENERAL CONTRACTING:**
- Framing: "framing", "2x4", "2x6", "2x8", "joists", "studs", "headers"
- Drywall: "drywall", "sheetrock", "mudding", "taping", "texture"
- Roofing: "shingles", "roof replacement", "roof repair", "flashing", "underlayment"
- Concrete: "foundation", "slab", "concrete pour", "footings", "sidewalk"
- Siding: "vinyl siding", "hardie board", "wood siding", "siding replacement"
- Flooring: "hardwood", "laminate", "tile", "carpet", "LVP", "subfloor"
- Painting: "interior painting", "exterior painting", "primer", "trim work"

**AUTO PARTS:**
- Brakes: "brake pads", "rotors", "calipers", "brake lines", "brake fluid"
- Engine: "oil filter", "air filter", "spark plugs", "alternator", "starter", "battery"
- Suspension: "shocks", "struts", "ball joints", "tie rods", "control arms"
- Exhaust: "muffler", "catalytic converter", "exhaust pipe", "O2 sensor"

**LANDSCAPING:**
- Materials: "mulch", "topsoil", "gravel", "pavers", "flagstone", "river rock"
- Services: "lawn mowing", "tree trimming", "hedge trimming", "leaf removal", "aeration"
- Hardscaping: "retaining wall", "patio", "walkway", "fire pit", "outdoor kitchen"
- Irrigation: "sprinkler system", "drip irrigation", "irrigation repair"

COMMON UNITS OF MEASUREMENT:
- **Linear**: "linear foot", "LF", "running foot", "per foot"
- **Area**: "square foot", "sq ft", "SF", "square yard", "SY", "square"
- **Volume**: "cubic yard", "CY", "cubic foot", "CF", "gallon", "ton"
- **Count**: "each", "EA", "per unit", "piece", "set", "pair"
- **Time**: "per hour", "hourly", "per day", "labor hour"
- **Weight**: "pound", "lb", "ton", "bag", "pallet"

QUANTITY EXTRACTION EXAMPLES:
- "500 square feet of drywall" → quantity: 500, unit: "Per Sq Ft"
- "3 GFCI outlets" → quantity: 3, unit: "Each"
- "10 yards of mulch" → quantity: 10, unit: "Per Cubic Yard"
- "2 hours of labor" → quantity: 2, unit: "Per Hour"
- "50 linear feet of fence" → quantity: 50, unit: "Per Linear Ft"

CONTEXT CLUES FOR DISAMBIGUATION:
- "panel" in electrical email → "electrical panel"
- "panel" in HVAC email → "access panel" or "control panel"
- "service" in electrical → "electrical service upgrade"
- "service" in HVAC → "HVAC service call"
- "line" in plumbing → "water line" or "sewer line"
- "line" in electrical → "power line" or "circuit"

HANDLING VAGUE REQUESTS:
- "Fix my AC" → "AC Repair" or "HVAC Service Call" (confidence: 70)
- "Need a quote" → "Quote Request" or "Consultation" (confidence: 40)
- "How much for..." → Extract the specific item mentioned (confidence: 60-80)
- "Emergency!" → "Emergency Service Call" (confidence: 85)

BEST PRACTICES:
1. Extract EXACTLY what the customer says, don't paraphrase unnecessarily
2. If customer uses brand names (e.g., "Rheem water heater"), include them
3. If customer mentions specific sizes/models (e.g., "40-gallon", "200-amp"), include them
4. For emergency requests, flag with "Emergency" prefix if appropriate
5. When in doubt, use broader terms that the fuzzy matching can handle

Extract the service/product name EXACTLY as the customer describes it. The system will use fuzzy matching to find it in the pricing database.

MIXED INTENT & HUMAN HANDOFF:
If the email contains questions or requests that require human judgment (e.g., scheduling availability, complex custom work, financing questions, complaints, or non-standard requests), set "requires_human_attention": true and provide a reason.

Example JSON with Human Attention:
{
    "customer_name": "John Doe",
    "service_requested": "Drywall repair",
    "quantity": 1,
    "confidence": 90,
    "needs_clarification": false,
    "requires_human_attention": true,
    "human_attention_reason": "Customer asked about scheduling availability for next Tuesday",
    "clarifying_questions": []
}

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
            needs_clarification = parsed_data.get("needs_clarification", False)
            clarifying_questions = parsed_data.get("clarifying_questions", [])
            requires_human_attention = parsed_data.get("requires_human_attention", False)
            human_attention_reason = parsed_data.get("human_attention_reason", "")
            
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
                "confidence": confidence,
                "needs_clarification": needs_clarification,
                "clarifying_questions": clarifying_questions,
                "requires_human_attention": requires_human_attention,
                "human_attention_reason": human_attention_reason
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
                }],
                "confidence": 0,
                "needs_clarification": True,
                "clarifying_questions": ["Could you please provide more details about the service you need?"]
            }
        
        except Exception as e:
            print(f"✗ Error calling OpenAI API: {e}")
            # Return default structure on error
            return {
                "customer_name": "Customer",
                "extracted_items": [{
                    "service_requested": "Service Call",
                    "quantity": 1
                }],
                "confidence": 0,
                "needs_clarification": True,
                "clarifying_questions": ["Could you please provide more details about the service you need?"]
            }

    def generate_clarification_email(self, customer_name: str, questions: List[str], company_name: str) -> str:
        """
        Generate a polite email body asking clarifying questions.
        """
        questions_text = "\n".join([f"- {q}" for q in questions])
        
        prompt = f"""You are a helpful assistant for {company_name}.
Write a polite, professional email to {customer_name} asking for clarification on their quote request.
Here are the specific questions to ask:
{questions_text}

Keep it brief and friendly. Do not include a subject line, just the body.
Sign off as "{company_name} Estimating Team"."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating clarification email: {e}")
            return f"""Hi {customer_name},

Thank you for your quote request. To provide you with an accurate estimate, we need a few more details:

{questions_text}

Please let us know at your earliest convenience.

Best regards,
{company_name} Estimating Team"""

    def generate_professional_email(self, customer_name: str, quote_data: Dict[str, Any], company_info: Dict[str, Any]) -> str:
        """
        Generate a professional email body to accompany a quote.
        
        Args:
            customer_name: Name of the customer
            quote_data: Dictionary containing quote details (items, total, quote_number)
            company_info: Dictionary containing company details (name, phone, email)
        
        Returns:
            Professional email body as string
        """
        company_name = company_info.get('company_name', 'Our Company')
        company_phone = company_info.get('phone', '')
        company_email = company_info.get('email', '')
        
        items_summary = "\n".join([
            f"- {item['service_name']} (Qty: {item['quantity']}): ${item['total']:.2f}"
            for item in quote_data.get('items', [])
        ])
        
        prompt = f"""You are writing a professional email on behalf of {company_name} to send a quote to a customer.

Customer Name: {customer_name}
Quote Number: {quote_data.get('quote_number', 'N/A')}
Total Amount: ${quote_data.get('total', 0):.2f}

Items Quoted:
{items_summary}

Write a professional, friendly email that:
1. Thanks the customer for their inquiry
2. Briefly mentions what services/products are included in the quote
3. Highlights that a detailed PDF quote is attached
4. Encourages them to reach out with any questions
5. Provides contact information ({company_phone}, {company_email})
6. Has a professional but warm tone
7. Is concise (3-4 short paragraphs max)

Do NOT include a subject line. Sign off as "{company_name} Team".
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating professional email: {e}")
            # Fallback template
            return f"""Hi {customer_name},

Thank you for your quote request! We're pleased to provide you with a detailed estimate for your project.

Your quote includes:
{items_summary}

Total: ${quote_data.get('total', 0):.2f}

Please find the complete quote attached as a PDF. If you have any questions or would like to discuss the details, feel free to reach out to us at {company_phone} or {company_email}.

We look forward to working with you!

Best regards,
{company_name} Team"""

