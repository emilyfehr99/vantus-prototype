---
description: Discover and verify police department email formats
---

Follow these steps to find and verify the email naming convention for a specific police department.

1. **Research Staff Emails**
   Use a search engine or browser agent to find official staff emails for the target city and department.
   Search query: `site:[domain] "@ [domain]" staff directory` or `site:[domain] "Chief of Police" email`
   
   Identify at least 2-3 names and their corresponding emails.

2. **Prepare Analysis Data**
   Create a temporary JSON file (e.g., `temp_emails.json`) with the found data:
   ```json
   [
     {"name": "First Last", "email": "flast@domain.gov"},
     {"name": "Another Person", "email": "aperson@domain.gov"}
   ]
   ```

3. **Run Discovery Tool**
   // turbo
   Run the analysis script to deduce the pattern:
   ```bash
   python3 police_email_finder.py --city "City Name" --domain "departmentdomain.gov" --analyze temp_emails.json
   ```

4. **Verify and Update Master List**
   Check the output in `discovered_formats.json`. If confirmed, add the new pattern to the master reference:
   [email_formats.md](file:///Users/emilyfehr8/.gemini/antigravity/brain/8d08ebca-3fd5-4f4a-b1d9-5f09c69b1f15/email_formats.md)
