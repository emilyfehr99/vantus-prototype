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
        quote_number: str = None
    ) -> str:
        """
        Generate a professional PDF quote.
        
        Args:
            customer_name: Name of the customer
            quote_data: Dictionary with line_items, subtotal, tax, total
            quote_number: Optional quote number
        
        Returns:
            Path to the generated PDF file
        """
        if quote_number is None:
            quote_number = f"QT-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        filename = f"{self.output_dir}/quote_{quote_number}.pdf"
        
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        
        # Header with branding
        self._draw_header(pdf)
        
        # Customer information
        y_pos = self._draw_customer_info(pdf, customer_name, quote_number)
        
        # Quote items table
        y_pos = self._draw_items_table(pdf, quote_data["line_items"], y_pos)
        
        # Total box
        self._draw_total_box(pdf, quote_data, y_pos)
        
        # Footer
        self._draw_footer(pdf)
        
        pdf.output(filename)
        print(f"✓ Generated PDF quote: {filename}")
        
        return filename
    
    def _draw_header(self, pdf: FPDF) -> None:
        """Draw the header with Velocity Logic branding."""
        # Company name in Navy Blue
        pdf.set_font("Arial", "B", 24)
        pdf.set_text_color(*self.NAVY_BLUE)
        pdf.cell(0, 15, "VELOCITY LOGIC", ln=1, align="L")
        
        # Tagline
        pdf.set_font("Arial", "", 10)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 5, "HVAC Solutions & Service", ln=1, align="L")
        
        # Date
        pdf.set_font("Arial", "", 10)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)
        pdf.cell(0, 5, f"Date: {datetime.now().strftime('%B %d, %Y')}", ln=1, align="R")
        
        pdf.ln(10)
    
    def _draw_customer_info(self, pdf: FPDF, customer_name: str, quote_number: str) -> float:
        """Draw customer information section."""
        pdf.set_font("Arial", "B", 12)
        pdf.set_text_color(*self.NAVY_BLUE)
        pdf.cell(0, 8, "QUOTE INFORMATION", ln=1)
        
        pdf.set_font("Arial", "", 10)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 5, f"Quote #: {quote_number}", ln=1)
        pdf.cell(0, 5, f"Customer: {customer_name}", ln=1)
        pdf.ln(5)
        
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
    
    def _draw_footer(self, pdf: FPDF) -> None:
        """Draw footer with company information."""
        pdf.set_y(-30)
        pdf.set_font("Arial", "", 8)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 5, "Thank you for choosing Velocity Logic!", ln=1, align="C")
        pdf.cell(0, 5, "This quote is valid for 30 days from the date issued.", ln=1, align="C")
        pdf.cell(0, 5, "For questions, please contact us at your convenience.", ln=1, align="C")

