"""
Email Sender - Sends job match reports via email.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any
from datetime import datetime
from .scrapers.base_scraper import Job


class EmailSender:
    """Sends job match reports via email."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize email sender with configuration.
        
        Args:
            config: Email configuration dictionary with:
                - smtp_server: SMTP server address
                - smtp_port: SMTP port
                - sender_email: Sender email address
                - sender_password: Sender email password/app password
                - recipient_email: Recipient email address
        """
        self.smtp_server = config.get("smtp_server", "smtp.gmail.com")
        self.smtp_port = config.get("smtp_port", 587)
        self.sender_email = config.get("sender_email")
        self.sender_password = config.get("sender_password")
        self.recipient_email = config.get("recipient_email")
    
    def send_job_report(self, jobs: List[Job], dry_run: bool = False) -> bool:
        """
        Send job matches report via email.
        
        Args:
            jobs: List of matched jobs with cover letters
            dry_run: If True, print email instead of sending
            
        Returns:
            True if email sent successfully
        """
        if not jobs:
            print("📭 No jobs to send")
            return False
        
        subject = self._create_subject(jobs)
        html_body = self._create_html_body(jobs)
        text_body = self._create_text_body(jobs)
        
        if dry_run:
            print("\n" + "="*60)
            print("📧 DRY RUN - Email would be sent:")
            print("="*60)
            print(f"To: {self.recipient_email}")
            print(f"Subject: {subject}")
            print("-"*60)
            print(text_body[:2000] + "..." if len(text_body) > 2000 else text_body)
            print("="*60)
            return True
        
        return self._send_email(subject, html_body, text_body)
    
    def _create_subject(self, jobs: List[Job]) -> str:
        """Create email subject line."""
        date_str = datetime.now().strftime("%B %d, %Y")
        top_score = max(job.match_score or 0 for job in jobs)
        return f"🎯 {len(jobs)} Job Matches Found - Top Score: {top_score}% ({date_str})"
    
    def _create_html_body(self, jobs: List[Job]) -> str:
        """Create HTML email body."""
        date_str = datetime.now().strftime("%B %d, %Y")
        
        # Build job cards HTML
        job_cards = ""
        for i, job in enumerate(jobs, 1):
            score_color = self._get_score_color(job.match_score or 0)
            missing_html = ""
            if job.missing_qualifications:
                missing_html = f"<p style='color: #666; font-size: 12px;'>📚 Skills to highlight: {', '.join(job.missing_qualifications[:3])}</p>"
            
            highlights_html = ""
            if job.highlights:
                highlights_html = f"<p style='color: #2e7d32; font-size: 12px;'>✨ Your strengths: {', '.join(job.highlights[:3])}</p>"
            
            cover_letter_html = ""
            if job.cover_letter:
                # Format bullet points as HTML list
                points = job.cover_letter.replace("<", "&lt;").replace(">", "&gt;")
                # Convert bullet points to list items
                lines = [line.strip() for line in points.split("\n") if line.strip()]
                list_items = "".join(f"<li style='margin: 8px 0;'>{line.lstrip('•').lstrip('-').strip()}</li>" for line in lines)
                cover_letter_html = f"""
                <div style='background: #e8f5e9; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #4caf50;'>
                    <h4 style='margin: 0 0 10px 0; color: #2e7d32;'>📝 Key Points to Include in Cover Letter</h4>
                    <ul style='font-size: 13px; line-height: 1.6; color: #444; margin: 0; padding-left: 20px;'>
                        {list_items}
                    </ul>
                </div>
                """
            
            job_cards += f"""
            <div style='border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 20px 0; background: white;'>
                <div style='display: flex; justify-content: space-between; align-items: flex-start;'>
                    <div>
                        <h2 style='margin: 0 0 5px 0; color: #1a1a1a;'>{i}. {job.title}</h2>
                        <p style='margin: 5px 0; color: #666; font-size: 14px;'>
                            🏢 {job.company} | 📍 {job.location} | 🔗 {job.source}
                        </p>
                    </div>
                    <div style='background: {score_color}; color: white; padding: 10px 15px; border-radius: 20px; font-weight: bold; font-size: 18px;'>
                        {job.match_score}%
                    </div>
                </div>
                
                <p style='color: #333; margin: 15px 0; line-height: 1.5;'>{job.match_reasoning}</p>
                
                {highlights_html}
                {missing_html}
                
                <a href='{job.url}' style='display: inline-block; background: #1976d2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 10px;'>
                    Apply Now →
                </a>
                
                {cover_letter_html}
            </div>
            """
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #f9f9f9;'>
            
            <div style='background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 30px; border-radius: 10px; text-align: center;'>
                <h1 style='margin: 0;'>🎯 Job Matches Report</h1>
                <p style='margin: 10px 0 0 0; opacity: 0.9;'>{date_str}</p>
            </div>
            
            <div style='background: white; padding: 20px; border-radius: 10px; margin: 20px 0;'>
                <h3 style='margin: 0 0 10px 0;'>📊 Summary</h3>
                <p style='color: #666; margin: 0;'>
                    Found <strong>{len(jobs)}</strong> jobs matching your profile. 
                    Top match score: <strong>{max(job.match_score or 0 for job in jobs)}%</strong>
                </p>
            </div>
            
            {job_cards}
            
            <div style='text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;'>
                <p>Generated by AI Job Finder Bot using Google Gemini</p>
                <p>Jobs sourced from: Indeed, LinkedIn, Job Bank Canada, Wellfound</p>
            </div>
            
        </body>
        </html>
        """
        
        return html
    
    def _create_text_body(self, jobs: List[Job]) -> str:
        """Create plain text email body (fallback)."""
        date_str = datetime.now().strftime("%B %d, %Y")
        
        lines = [
            f"JOB MATCHES REPORT - {date_str}",
            "=" * 50,
            f"\nFound {len(jobs)} jobs matching your profile.\n",
        ]
        
        for i, job in enumerate(jobs, 1):
            lines.append(f"\n{'='*50}")
            lines.append(f"{i}. {job.title}")
            lines.append(f"   Company: {job.company}")
            lines.append(f"   Location: {job.location}")
            lines.append(f"   Source: {job.source}")
            lines.append(f"   Match Score: {job.match_score}%")
            lines.append(f"\n   Why this is a match:")
            lines.append(f"   {job.match_reasoning}")
            
            if job.highlights:
                lines.append(f"\n   Your strengths: {', '.join(job.highlights[:3])}")
            
            if job.missing_qualifications:
                lines.append(f"   Skills to highlight: {', '.join(job.missing_qualifications[:3])}")
            
            lines.append(f"\n   Apply: {job.url}")
            
            if job.cover_letter:
                lines.append(f"\n   --- KEY POINTS TO INCLUDE ---")
                lines.append(f"   {job.cover_letter}")
                lines.append(f"   -------------------------------")
        
        lines.append("\n" + "=" * 50)
        lines.append("Generated by AI Job Finder Bot")
        
        return "\n".join(lines)
    
    def _get_score_color(self, score: int) -> str:
        """Get color based on match score."""
        if score >= 85:
            return "#2e7d32"  # Green
        elif score >= 70:
            return "#f57c00"  # Orange
        else:
            return "#757575"  # Gray
    
    def _send_email(self, subject: str, html_body: str, text_body: str) -> bool:
        """Send the email via SMTP."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.sender_email
            msg["To"] = self.recipient_email
            
            # Attach both plain text and HTML versions
            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))
            
            print(f"\n📧 Sending email to {self.recipient_email}...")
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, self.recipient_email, msg.as_string())
            
            print("✅ Email sent successfully!")
            return True
            
        except smtplib.SMTPAuthenticationError:
            print("❌ Email authentication failed. Check your email/password.")
            print("   For Gmail, use an App Password: https://myaccount.google.com/apppasswords")
            return False
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            return False
    
    def test_connection(self) -> bool:
        """Test email configuration."""
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
            print("✅ Email connection successful!")
            return True
        except Exception as e:
            print(f"❌ Email connection failed: {e}")
            return False
