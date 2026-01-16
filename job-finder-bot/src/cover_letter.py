"""
Cover Letter Key Points Generator - AI-powered talking points using Gemini.
"""

from typing import List
from .gemini_client import GeminiClient
from .scrapers.base_scraper import Job


class CoverLetterGenerator:
    """Generates key talking points to include in cover letters using Gemini AI."""
    
    def __init__(self, gemini_client: GeminiClient):
        self.gemini = gemini_client
    
    def generate_cover_letters(self, jobs: List[Job], resume_text: str) -> List[Job]:
        """
        Generate key talking points for all matched jobs.
        
        Args:
            jobs: List of matched Job objects
            resume_text: Full resume text
            
        Returns:
            Jobs with cover_letter field populated with key points
        """
        print(f"\n📝 Generating key talking points for {len(jobs)} jobs...")
        
        for i, job in enumerate(jobs):
            print(f"  [{i+1}/{len(jobs)}] Analyzing: {job.title} at {job.company}...")
            
            try:
                key_points = self._generate_key_points(job, resume_text)
                job.cover_letter = key_points
                print(f"    ✓ Key points generated")
            except Exception as e:
                print(f"    ⚠ Error generating key points: {e}")
                job.cover_letter = self._fallback_points(job)
        
        return jobs
    
    def _generate_key_points(self, job: Job, resume_text: str) -> str:
        """Generate key talking points for a specific job."""
        
        prompt = f"""Analyze this job and candidate's resume, then provide 5-7 MUST-INCLUDE talking points for their cover letter.

JOB DETAILS:
Position: {job.title}
Company: {job.company}
Location: {job.location}
Description: {job.description}

CANDIDATE'S RESUME:
{resume_text}

MATCH HIGHLIGHTS (from AI analysis):
{', '.join(job.highlights) if job.highlights else 'Strong analytical and data skills'}

INSTRUCTIONS:
Generate 5-7 bullet points that the candidate MUST mention in their cover letter. Each point should be:
- Specific and actionable (not generic advice)
- Connected to both the job requirements AND the candidate's actual experience
- Include specific metrics, projects, or achievements from their resume when relevant

Format as bullet points starting with "•". Focus on:
1. Most relevant experience to highlight (with specific examples from resume)
2. Key technical skills that match the job requirements
3. Unique value proposition (what sets this candidate apart)
4. Company-specific angle (why this company specifically)
5. Transferable skills or achievements to emphasize

Output ONLY the bullet points, no introduction or conclusion:"""

        response = self.gemini.generate(prompt)
        
        if response:
            return response.strip()
        
        return self._fallback_points(job)
    
    def _fallback_points(self, job: Job) -> str:
        """Generate fallback key points if AI fails."""
        return f"""• Highlight your experience with Python, R, and SQL for data analysis
• Mention your sports analytics background as a unique differentiator
• Reference your computer vision work at Stathletes for technical credibility  
• Connect your experience building analytical dashboards and reports
• Emphasize your ability to translate data into actionable insights for coaches/stakeholders
• Show enthusiasm for {job.company} specifically and the {job.title} role"""
    
    def generate_single(self, job: Job, resume_text: str) -> str:
        """Generate key points for a single job (convenience method)."""
        return self._generate_key_points(job, resume_text)
