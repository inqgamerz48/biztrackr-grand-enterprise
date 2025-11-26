from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
from typing import Dict

class NumberedCanvas(canvas.Canvas):
    """Custom canvas to add page numbers and borders"""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_border()
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_border(self):
        """Draw a border around the page"""
        self.saveState()
        self.setStrokeColor(colors.HexColor('#1e40af'))
        self.setLineWidth(2)
        self.rect(30, 30, A4[0] - 60, A4[1] - 60)
        self.restoreState()

    def draw_page_number(self, page_count):
        """Add page number at bottom"""
        self.saveState()
        self.setFont('Helvetica', 9)
        self.setFillColor(colors.grey)
        page_num = f"Page {self._pageNumber} of {page_count}"
        self.drawCentredString(A4[0] / 2, 15*mm, page_num)
        self.restoreState()

def generate_purchase_receipt_pdf(purchase_data: Dict) -> BytesIO:
    """
    Generate a professional PDF receipt for a purchase.
    
    Args:
        purchase_data: Dictionary containing purchase information
    
    Returns:
        BytesIO: PDF file in memory
    """
    buffer = BytesIO()
    
    # Create PDF document with custom canvas
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )
    
    # Container for elements
    elements = []
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    company_style = ParagraphStyle(
        'Company',
        parent=styles['Heading1'],
        fontSize=32,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=36
    )
    
    tagline_style = ParagraphStyle(
        'Tagline',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#6b7280'),
        spaceAfter=8,
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique'
    )
    
    receipt_title_style = ParagraphStyle(
        'ReceiptTitle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.white,
        spaceAfter=0,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        backColor=colors.HexColor('#1e40af'),
        borderPadding=8
    )
    
    section_heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading3'],
        fontSize=13,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=8,
        spaceBefore=4,
        fontName='Helvetica-Bold',
        backColor=colors.HexColor('#eff6ff')
    )
    
    info_style = ParagraphStyle(
        'Info',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#374151'),
        leading=14
    )
    
    # Company Header
    elements.append(Paragraph("BizTracker PRO", company_style))
    elements.append(Paragraph("Your Complete Business Management Solution", tagline_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Company contact info
    contact_info = """
    <para align=center>
    <font size=9 color=#6b7280>
    📍 123 Business Street, Mumbai, Maharashtra 400001<br/>
    📞 +91 98765 43210 | ✉ support@biztrackerpro.com<br/>
    🌐 www.biztrackerpro.com
    </font>
    </para>
    """
    elements.append(Paragraph(contact_info, styles['Normal']))
    elements.append(Spacer(1, 0.15*inch))
    
    # Receipt title bar
    elements.append(Paragraph("PURCHASE ORDER", receipt_title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Purchase details
    purchase_date = purchase_data['date']
    if isinstance(purchase_date, str):
        purchase_date = datetime.fromisoformat(purchase_date.replace('Z', '+00:00'))
    
    # Create purchase info table
    purchase_info_data = [
        ['Invoice Number:', purchase_data['invoice_number'], 'Date:', purchase_date.strftime('%d-%b-%Y')],
        ['Supplier:', purchase_data.get('supplier_name', 'N/A'), 'Time:', purchase_date.strftime('%I:%M %p')]
    ]
    
    purchase_info_table = Table(purchase_info_data, colWidths=[1.5*inch, 2*inch, 1*inch, 1.3*inch])
    purchase_info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb'))
    ]))
    
    elements.append(purchase_info_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # Items section
    elements.append(Paragraph("ITEMS PURCHASED", section_heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Items table
    table_data = [
        [Paragraph('<b>Item Description</b>', styles['Normal']), 
         Paragraph('<b>Qty</b>', styles['Normal']), 
         Paragraph('<b>Price (₹)</b>', styles['Normal']), 
         Paragraph('<b>Total (₹)</b>', styles['Normal'])]
    ]
    
    for item in purchase_data['items']:
        table_data.append([
            Paragraph(item['name'], info_style),
            Paragraph(str(item['quantity']), info_style),
            Paragraph(f"{item['price']:,.2f}", info_style),
            Paragraph(f"<b>{item['total']:,.2f}</b>", info_style)
        ])
    
    # Create table
    col_widths = [3.5*inch, 0.8*inch, 1.3*inch, 1.4*inch]
    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        
        # Data rows
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('LEFTPADDING', (0, 1), (-1, -1), 6),
        ('RIGHTPADDING', (0, 1), (-1, -1), 6),
        
        # Grid and borders
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#1e40af')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#1e40af')),
        
        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # Payment Summary
    elements.append(Paragraph("PAYMENT SUMMARY", section_heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    summary_data = []
    summary_data.append(['Subtotal:', f"₹ {purchase_data['subtotal']:,.2f}"])
    
    if purchase_data.get('transport_charges', 0) > 0:
        summary_data.append(['Transport Charges:', f"₹ {purchase_data['transport_charges']:,.2f}"])
    
    # Add separator line
    summary_data.append(['', ''])
    summary_data.append([Paragraph('<b>GRAND TOTAL:</b>', styles['Normal']), 
                        Paragraph(f"<b>₹ {purchase_data['total_amount']:,.2f}</b>", styles['Normal'])])
    
    summary_table = Table(summary_data, colWidths=[5.2*inch, 1.8*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -3), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -3), 11),
        ('FONTSIZE', (0, -1), (-1, -1), 16),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#1e40af')),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#1e40af')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, -1), (-1, -1), 12),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 12),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#eff6ff')),
        ('BOX', (0, -1), (-1, -1), 1.5, colors.HexColor('#1e40af'))
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 0.4*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#1e40af'),
        alignment=TA_CENTER,
        spaceAfter=4,
        fontName='Helvetica-Bold'
    )
    
    footer_note_style = ParagraphStyle(
        'FooterNote',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER,
        leading=10
    )
    
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e5e7eb')))
    elements.append(Spacer(1, 0.15*inch))
    elements.append(Paragraph("Purchase Order Confirmed", footer_style))
    elements.append(Paragraph("Powered by BizTracker PRO", footer_note_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("This is a computer-generated document and does not require a signature.", footer_note_style))
    
    # Build PDF with custom canvas
    doc.build(elements, canvasmaker=NumberedCanvas)
    
    # Reset buffer position
    buffer.seek(0)
    return buffer
