from services.pricing_engine import PricingEngine

try:
    print("Initializing Pricing Engine...")
    engine = PricingEngine()
    
    print("Calculating quote for 'Test Service'...")
    items = [{"service_requested": "Test Service", "quantity": 1}]
    quote = engine.calculate_quote(items)
    
    print(f"Quote Result: {quote}")
    
    # Check if the price matches the test CSV value
    expected_price = 999.99
    actual_price = quote['line_items'][0]['unit_price']
    
    if actual_price == expected_price:
        print("✅ SUCCESS: Pricing engine is using the new CSV data.")
    else:
        print(f"❌ FAILURE: Expected price {expected_price}, got {actual_price}")

except Exception as e:
    print(f"Error: {e}")
