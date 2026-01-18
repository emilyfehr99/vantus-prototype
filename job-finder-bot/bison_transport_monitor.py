#!/usr/bin/env python3
"""
Bison Transport Job Monitor
============================
Automated job alert system for specific analytics roles at Bison Transport.
Monitors the Workday API and sends email alerts when matching positions are posted.
"""

import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import json
import time
from pathlib import Path

import os

# --- CONFIGURATION ---
KEYWORDS = [
    "Logistics Analyst", 
    "Tactical Analyst", 
    "Sales Operations Analyst", 
    "EDI Support Analyst", 
    "Data Engineering", 
    "Power BI", 
    "Business Analyst", 
    "Application Support Analyst",
    "Data Analyst",
    "Business Intelligence",
    "Analytics"
]

# Email Configuration
# PRIORITIZE ENVIRONMENT VARIABLES (for GitHub Actions)
# Fallback to hardcoded values for local testing
MY_EMAIL = os.environ.get("MY_EMAIL", "8emilyfehr@gmail.com")
APP_PASSWORD = os.environ.get("APP_PASSWORD", "nyhuejmpcxpvruel")
ALERT_RECEIVER = os.environ.get("ALERT_RECEIVER", "8emilyfehr@gmail.com")

# Bison Transport Workday API Endpoint (correct tenant is 'bison', not 'bisontransport')
URL = "https://bison.wd3.myworkdayjobs.com/wday/cxs/bison/BisonNon-DrivingCareers/jobs"

# Location filter - only Winnipeg jobs
LOCATION_KEYWORDS = ["Winnipeg", "winnipeg", "WINNIPEG", "Winnipeg, MB"]

# Track jobs we've already alerted on (to avoid duplicate alerts)
TRACKING_FILE = Path(__file__).parent / "bison_alerted_jobs.json"


def load_alerted_jobs():
    """Load the list of jobs we've already sent alerts for."""
    if TRACKING_FILE.exists():
        with open(TRACKING_FILE, 'r') as f:
            return set(json.load(f))
    return set()


def save_alerted_jobs(job_ids):
    """Save the list of jobs we've alerted on."""
    with open(TRACKING_FILE, 'w') as f:
        json.dump(list(job_ids), f, indent=2)


def check_jobs():
    """Check Bison Transport's Workday API for matching jobs."""
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    payload = {
        "appliedFacets": {},
        "limit": 20,
        "offset": 0,
        "searchText": ""
    }
    
    try:
        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Checking Bison Transport careers...")
        
        response = requests.post(URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        job_data = response.json().get('jobPostings', [])
        
        # Load previously alerted jobs
        alerted_jobs = load_alerted_jobs()
        
        matches = []
        for job in job_data:
            title = job.get('title', '')
            job_id = job.get('bulletFields', [None])[0] if job.get('bulletFields') else title
            location = job.get('locationsText', 'Location not specified')
            
            # Check if this matches our keywords, is in Winnipeg, and we haven't alerted on it yet
            title_matches = any(key.lower() in title.lower() for key in KEYWORDS)
            location_matches = any(loc in location for loc in LOCATION_KEYWORDS)
            
            if title_matches and location_matches:
                if job_id not in alerted_jobs:
                    link = "https://bison.wd3.myworkdayjobs.com/en-US/BisonNon-DrivingCareers" + job.get('externalPath', '')
                    posted_date = job.get('postedOn', 'Unknown date')
                    
                    matches.append({
                        'id': job_id,
                        'title': title,
                        'link': link,
                        'location': location,
                        'posted': posted_date
                    })
                    
                    # Mark as alerted
                    alerted_jobs.add(job_id)
        
        if matches:
            print(f"  ✅ Found {len(matches)} NEW matching job(s)!")
            send_email(matches)
            save_alerted_jobs(alerted_jobs)
        else:
            print(f"  📋 Checked {len(job_data)} jobs - no new matches found.")
            
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Error checking jobs: {e}")
    except Exception as e:
        print(f"  ❌ Unexpected error: {e}")


def send_email(matches):
    """Send an email alert with the matching jobs."""
    # Create HTML email body
    html_body = f"""
    <html>
      <head>
        <style>
          body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
          .header {{ background-color: #003B5C; color: white; padding: 20px; text-align: center; }}
          .job-card {{ 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 15px 0;
            background-color: #f9f9f9;
          }}
          .job-title {{ color: #003B5C; font-size: 18px; font-weight: bold; margin-bottom: 5px; }}
          .job-meta {{ color: #666; font-size: 14px; margin: 5px 0; }}
          .apply-btn {{
            display: inline-block;
            background-color: #003B5C;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
          }}
          .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }}
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 Bison Transport Job Alert</h1>
          <p>New analytics roles matching your criteria have been posted!</p>
        </div>
        
        <div style="padding: 20px;">
          <p>Hi Emily,</p>
          <p>The following <strong>{len(matches)}</strong> new analytics role(s) were found at <strong>Bison Transport</strong>:</p>
    """
    
    # Add each job
    for job in matches:
        html_body += f"""
          <div class="job-card">
            <div class="job-title">{job['title']}</div>
            <div class="job-meta">📍 {job['location']}</div>
            <div class="job-meta">📅 Posted: {job['posted']}</div>
            <a href="{job['link']}" class="apply-btn">View & Apply</a>
          </div>
        """
    
    html_body += f"""
          <div class="footer">
            <p>This is an automated alert from your Bison Transport Job Monitor</p>
            <p>Checked at {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
          </div>
        </div>
      </body>
    </html>
    """
    
    # Plain text version
    plain_body = f"""
🎯 BISON TRANSPORT JOB ALERT
{datetime.now().strftime('%B %d, %Y at %I:%M %p')}

Hi Emily,

The following {len(matches)} new analytics role(s) were found at Bison Transport:

"""
    
    for job in matches:
        plain_body += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{job['title']}
Location: {job['location']}
Posted: {job['posted']}
Apply: {job['link']}

"""
    
    plain_body += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated alert from your Bison Transport Job Monitor.
"""
    
    # Create multipart message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"🚨 JOB ALERT: {len(matches)} New Bison Transport Analytics Role(s)!"
    msg['From'] = MY_EMAIL
    msg['To'] = ALERT_RECEIVER
    
    # Attach both plain and HTML versions
    msg.attach(MIMEText(plain_body, 'plain'))
    msg.attach(MIMEText(html_body, 'html'))
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(MY_EMAIL, APP_PASSWORD)
            server.send_message(msg)
        print(f"  ✉️  Alert email sent successfully!")
    except Exception as e:
        print(f"  ❌ Error sending email: {e}")


def run_once():
    """Run the job check once."""
    print("=" * 60)
    print("🔍 Bison Transport Job Monitor")
    print("=" * 60)
    check_jobs()
    print("=" * 60)


def run_continuously(check_interval_hours=24):
    """Run the job check on a schedule."""
    print("=" * 60)
    print("🔍 Bison Transport Job Monitor")
    print("   Running in continuous mode")
    print(f"   Check interval: Every {check_interval_hours} hours")
    print("   Press Ctrl+C to stop")
    print("=" * 60)
    
    while True:
        try:
            check_jobs()
            
            # Wait until next check
            next_check = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
            if datetime.now().hour >= 9:
                # If it's already past 9 AM, schedule for tomorrow
                from datetime import timedelta
                next_check += timedelta(days=1)
            
            wait_seconds = (next_check - datetime.now()).total_seconds()
            hours = int(wait_seconds // 3600)
            minutes = int((wait_seconds % 3600) // 60)
            
            print(f"\n⏰ Next check scheduled in {hours}h {minutes}m at {next_check.strftime('%I:%M %p')}")
            print("=" * 60)
            
            time.sleep(wait_seconds)
            
        except KeyboardInterrupt:
            print("\n\n👋 Monitor stopped. Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error in main loop: {e}")
            print("   Waiting 1 hour before retry...")
            time.sleep(3600)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--continuous":
        # Run continuously (for background/daemon mode)
        run_continuously()
    else:
        # Run once (for manual testing or cron jobs)
        run_once()
