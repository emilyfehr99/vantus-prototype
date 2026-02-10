import re
import json
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Optional

# This tool helps map US Police Department email formats by searching for staff emails
# and deducing the naming pattern (e.g., first.last@, flast@, etc.)

try:
    from googlesearch import search
    HAS_SEARCH = True
except ImportError:
    HAS_SEARCH = False

class EmailPatternFinder:
    def __init__(self, output_file: str = "discovered_formats.json"):
        self.output_file = Path(output_file)
        self.results = self.load_results()

    def load_results(self) -> Dict:
        if self.output_file.exists():
            try:
                with open(self.output_file, 'r') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return {"confirmed": {}, "uncategorized": {}}
        return {"confirmed": {}, "uncategorized": {}}

    def save_results(self):
        with open(self.output_file, 'w') as f:
            json.dump(self.results, f, indent=4)

    def deduce_pattern(self, first_name: str, last_name: str, email_user: str) -> Optional[str]:
        """
        Deduces the pattern from a known name and email prefix.
        """
        first = first_name.lower()
        last = last_name.lower()
        prefix = email_user.lower()

        patterns = {
            f"{first}.{last}": "first.last",
            f"{first}_{last}": "first_last",
            f"{first[0]}{last}": "flast",
            f"{first}{last[0]}": "firstl",
            f"{last}{first[0]}": "lastf",
            f"{first}{last}": "firstlast",
            f"{first}": "first",
            f"{last}": "last",
            f"{first[0]}.{last}": "f.last",
            f"{first}.{last[0]}": "first.l"
        }
        
        return patterns.get(prefix, "unknown")

    def search_for_emails(self, domain: str, city: str) -> List[Dict]:
        """
        Searches for staff emails on the given domain.
        """
        if not HAS_SEARCH:
            print("[!] 'googlesearch-python' not installed. Please install to use live search.")
            return []

        print(f"[*] Searching for staff emails at {domain} for {city}...")
        query = f"site:{domain} \"@ {domain}\" police staff"
        results = []
        
        try:
            # Search for pages that might contain emails
            for url in search(query, num_results=5):
                print(f"[*] Checking {url}")
                # In a full implementation, we would use requests + bs4 to scrape these pages.
                # For this version, we'll prompt the user to provide emails or search manually if needed.
        except Exception as e:
            print(f"[!] Search failed: {e}")
            
        return results

    def analyze_emails(self, domain: str, city: str, found_entries: List[Dict]):
        """
        Analyzes a list of entries e.g. [{"name": "John Doe", "email": "jdoe@city.gov"}]
        """
        detected_patterns = []
        # Clean domain for comparison (remove @ if present)
        clean_domain = domain.lstrip('@').lower()
        
        for entry in found_entries:
            name = entry.get('name', '')
            email = entry.get('email', '')
            if not name or not email:
                continue
            
            # Filter by domain
            if not email.lower().endswith(clean_domain):
                continue
                
            name_parts = name.split()
            if len(name_parts) < 2:
                continue
            
            first, last = name_parts[0], name_parts[-1]
            email_prefix = email.split('@')[0]
            
            pattern = self.deduce_pattern(first, last, email_prefix)
            if pattern and pattern != "unknown":
                detected_patterns.append(pattern)

        if not detected_patterns:
            print(f"[-] No clear pattern found for {city} ({domain})")
            return

        most_common = max(set(detected_patterns), key=detected_patterns.count)
        
        # Update results
        self.results["confirmed"][domain] = {
            "city": city,
            "pattern": most_common,
            "confidence": f"{detected_patterns.count(most_common)}/{len(detected_patterns)}",
            "examples": found_entries[:3]
        }
        print(f"[+] Confirmed {most_common} for {city} ({domain})")
        self.save_results()

def main():
    parser = argparse.ArgumentParser(description="Police Email Format Discovery Tool")
    parser.add_argument("--city", help="City name")
    parser.add_argument("--domain", help="Email domain (e.g. city.gov)")
    parser.add_argument("--analyze", help="JSON file with found names/emails to analyze")
    parser.add_argument("--search", action="store_true", help="Attempt live search (requires googlesearch-python)")
    
    args = parser.parse_args()
    finder = EmailPatternFinder()

    if args.analyze and args.city and args.domain:
        with open(args.analyze, 'r') as f:
            data = json.load(f)
        finder.analyze_emails(args.domain, args.city, data)
    elif args.search and args.city and args.domain:
        finder.search_for_emails(args.domain, args.city)
    else:
        print("\nPolice Email Format Discovery Tool v1.1")
        print("-" * 40)
        print("Usage examples:")
        print("1. Analyze local data:")
        print("   python3 police_email_finder.py --city 'Houston' --domain 'houstonpolice.org' --analyze data.json")
        print("\n2. Live search (requires setup):")
        print("   python3 police_email_finder.py --city 'Houston' --domain 'houstonpolice.org' --search")

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()
