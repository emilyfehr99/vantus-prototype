"""
PDF Service
Generates professional PDF quotes with Velocity Logic branding.
"""

try:
    from fpdf import FPDF
except ImportError:
    from fpdf2 import FPDF
from typing import Dict, Any, List
from datetime import datetime
import os


class PDFService:
    """Generates professional PDF quotes."""
    
    # Brand colors
    NAVY_BLUE = (15, 23, 42)  # #0f172a
    TEAL_ACCENT = (45, 212, 191)  # #2dd4bf
    
    def __init__(self, output_dir: str = "output"):
        """
        Initialize PDF service.
        
        Args:
            output_dir: Directory to save generated PDFs
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_quote_pdf(
        self,
        customer_name: str,
        quote_data: Dict[str, Any],
        quote_number: str = None,
        company_info: Dict[str, Any] = None
    ) -> str:
        """
        Generate a professional PDF quote.
        
        Args:
            customer_name: Name of the customer
            quote_data: Dictionary with line_items, subtotal, tax, total
            quote_number: Optional quote number
            company_info: Dictionary with company branding info
        
        Returns:
            Path to the generated PDF file
        """
        if quote_number is None:
            quote_number = f"QT-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            
        # Default company info if not provided
        if not company_info:
            company_info = {
                "company_name": "Velocity Logic",
                "tagline": "HVAC Solutions & Service",
                "address": "123 Tech Blvd, San Francisco, CA",
                "phone": "(555) 123-4567",
                "email": "support@velocitylogic.com",
                "website": "www.velocitylogic.com"
            }
        
        filename = f"{self.output_dir}/quote_{quote_number}.pdf"
        
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        
        # Header with branding
        self._draw_header(pdf, company_info)
        
        # Customer information
        y_pos = self._draw_customer_info(pdf, customer_name, quote_number, company_info)
        
        # Quote items table
        y_pos = self._draw_items_table(pdf, quote_data["line_items"], y_pos)
        
        # Total box
        self._draw_total_box(pdf, quote_data, y_pos)
        
        # Footer
        self._draw_footer(pdf, company_info)
        
        pdf.output(filename)
        print(f"✓ Generated PDF quote: {filename}")
        
        return filename
    
    def _draw_header(self, pdf: FPDF, company_info: Dict[str, Any]) -> None:
        """Draw the header with company branding."""
        # Logo (if available)
        logo_path = company_info.get("logo_path")
        if logo_path and os.path.exists(logo_path):
            try:
                # Draw logo at top left
                pdf.image(logo_path, x=10, y=8, h=20)
                # Move cursor to the right of the logo
                pdf.set_xy(40, 10)
            except Exception as e:
                print(f"⚠ Could not load logo: {e}")
                pdf.set_xy(10, 10)
        else:
            pdf.set_xy(10, 10)

        # Company name in Navy Blue
        pdf.set_font("Arial", "B", 24)
        pdf.set_text_color(*self.NAVY_BLUE)
        pdf.cell(0, 15, company_info.get("company_name", "Velocity Logic"), ln=1, align="L")
        
        # Tagline
        pdf.set_font("Arial", "", 10)
        pdf.set_text_color(100, 100, 100)
        pdf.set_x(40 if logo_path and os.path.exists(logo_path) else 10)
        pdf.cell(0, 5, company_info.get("tagline", ""), ln=1, align="L")
        
        # Date
        pdf.set_font("Arial", "", 10)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)
        pdf.cell(0, 5, f"Date: {datetime.now().strftime('%B %d, %Y')}", ln=1, align="R")
        
        pdf.ln(10)
    
    def _draw_customer_info(self, pdf: FPDF, customer_name: str, quote_number: str, company_info: Dict[str, Any]) -> float:
        """Draw customer information section."""
        pdf.set_font("Arial", "B", 12)
        pdf.set_text_color(*self.NAVY_BLUE)
        pdf.cell(0, 8, "QUOTE INFORMATION", ln=1)
        
        pdf.set_font("Arial", "", 10)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 5, f"Quote #: {quote_number}", ln=1)
        pdf.cell(0, 5, f"Customer: {customer_name}", ln=1)
        
        # Company Contact Info
        pdf.set_xy(120, pdf.get_y() - 10)
        pdf.set_font("Arial", "B", 10)
        pdf.cell(0, 5, "From:", ln=1, align="L")
        pdf.set_font("Arial", "", 9)
        pdf.set_xy(120, pdf.get_y())
        pdf.cell(0, 5, company_info.get("address", ""), ln=1, align="L")
        pdf.set_xy(120, pdf.get_y())
        pdf.cell(0, 5, company_info.get("phone", ""), ln=1, align="L")
        pdf.set_xy(120, pdf.get_y())
        pdf.cell(0, 5, company_info.get("email", ""), ln=1, align="L")
        
        pdf.ln(15)
        
        return pdf.get_y()
    
    def _draw_items_table(self, pdf: FPDF, line_items: List[Dict[str, Any]], start_y: float) -> float:
        """Draw the items table."""
        # Table header
        pdf.set_font("Arial", "B", 10)
        pdf.set_text_color(*self.NAVY_BLUE)
        pdf.set_fill_color(240, 240, 240)
        
        # Header row
        pdf.cell(80, 8, "Service", border=1, fill=True)
        pdf.cell(20, 8, "Qty", border=1, fill=True, align="C")
        pdf.cell(30, 8, "Unit Price", border=1, fill=True, align="R")
        pdf.cell(30, 8, "Total", border=1, fill=True, align="R")
        pdf.ln()
        
        # Table rows
        pdf.set_font("Arial", "", 9)
        pdf.set_text_color(0, 0, 0)
        pdf.set_fill_color(255, 255, 255)
        
        for item in line_items:
            # Service name (with description if available)
            service_text = item["service_name"]
            if item.get("description") and len(item["description"]) > 0:
                service_text += f"\n{item['description']}"
            
            # Calculate height needed for this row
            service_lines = len(service_text.split("\n"))
            row_height = max(8, service_lines * 4)
            
            # Service column
            pdf.multi_cell(80, row_height / service_lines, service_text, border=1, fill=True, align="L")
            x = pdf.get_x()
            y = pdf.get_y()
            
            # Quantity
            pdf.set_xy(x + 80, y - row_height)
            pdf.cell(20, row_height, str(item["quantity"]), border=1, fill=True, align="C")
            
            # Unit price
            pdf.cell(30, row_height, f"${item['unit_price']:.2f}", border=1, fill=True, align="R")
            
            # Total
            pdf.cell(30, row_height, f"${item['line_total']:.2f}", border=1, fill=True, align="R")
            
            pdf.ln(row_height)
        
        pdf.ln(5)
        return pdf.get_y()
    
    def _draw_total_box(self, pdf: FPDF, quote_data: Dict[str, Any], start_y: float) -> None:
        """Draw the total box with teal accent."""
        # Position the total box on the right
        pdf.set_xy(120, start_y)
        
        # Box background with teal accent
        pdf.set_fill_color(*self.TEAL_ACCENT)
        pdf.set_draw_color(*self.TEAL_ACCENT)
        pdf.rect(120, start_y, 80, 40, style="FD")
        
        # Text in white for contrast
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Arial", "B", 10)
        
        # Subtotal
        pdf.set_xy(125, start_y + 5)
        pdf.cell(70, 8, "Subtotal:", align="L")
        pdf.set_xy(125, start_y + 5)
        pdf.cell(70, 8, f"${quote_data['subtotal']:.2f}", align="R")
        
        # Tax
        pdf.set_xy(125, start_y + 15)
        pdf.cell(70, 8, f"Tax ({quote_data.get('tax_rate', 0.1)*100:.1f}%):", align="L")
        pdf.set_xy(125, start_y + 15)
        pdf.cell(70, 8, f"${quote_data['tax']:.2f}", align="R")
        
        # Total
        pdf.set_font("Arial", "B", 12)
        pdf.set_xy(125, start_y + 28)
        pdf.cell(70, 8, "TOTAL:", align="L")
        pdf.set_xy(125, start_y + 28)
        pdf.cell(70, 8, f"${quote_data['total']:.2f}", align="R")
    
    def _draw_footer(self, pdf: FPDF, company_info: Dict[str, Any]) -> None:
        """Draw footer with company information."""
        pdf.set_y(-30)
        pdf.set_font("Arial", "", 8)
        pdf.set_text_color(100, 100, 100)
        
        company_name = company_info.get("company_name", "Velocity Logic")
        website = company_info.get("website", "")
        
        pdf.cell(0, 5, f"Thank you for choosing {company_name}!", ln=1, align="C")
        pdf.cell(0, 5, "This quote is valid for 30 days from the date issued.", ln=1, align="C")
        if website:
            pdf.cell(0, 5, f"Visit us at {website}", ln=1, align="C")

