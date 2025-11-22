from main import VelocityLogicAgent
import sys

try:
    print("Initializing agent...")
    agent = VelocityLogicAgent()
    
    print("Processing test email...")
    result = agent.process_email(
        email_body="I need a quote for a new furnace installation.",
        from_email="test@example.com"
    )
    
    print(f"Result: {result}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
