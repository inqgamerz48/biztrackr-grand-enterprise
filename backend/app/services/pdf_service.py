from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
from typing import List, Dict

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

def generate_sale_receipt_pdf(sale_data: Dict) -> BytesIO:
    """
    Generate a professional PDF receipt for a sale.
    
    Args:
        sale_data: Dictionary containing sale information
    
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
        borderWidth=0,
        borderColor=colors.HexColor('#1e40af'),
        borderPadding=4,
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
    elements.append(Paragraph("SALES RECEIPT", receipt_title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Invoice details
    invoice_date = sale_data['date']
    if isinstance(invoice_date, str):
        invoice_date = datetime.fromisoformat(invoice_date.replace('Z', '+00:00'))
    
    # Create invoice info table for better layout
    invoice_data = [
        ['Invoice Number:', sale_data['invoice_number'], 'Date:', invoice_date.strftime('%d-%b-%Y')],
        ['Payment Method:', sale_data.get('payment_method', 'Cash'), 'Time:', invoice_date.strftime('%I:%M %p')]
    ]
    
    if sale_data.get('customer_name'):
        invoice_data.append(['Customer:', sale_data['customer_name'], '', ''])
    
    invoice_table = Table(invoice_data, colWidths=[1.5*inch, 2*inch, 1*inch, 1.3*inch])
    invoice_table.setStyle(TableStyle([
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
    
    elements.append(invoice_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # Products section
    elements.append(Paragraph("ITEMS PURCHASED", section_heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Items table with enhanced styling
    table_data = [
        [Paragraph('<b>Item Description</b>', styles['Normal']), 
         Paragraph('<b>Qty</b>', styles['Normal']), 
         Paragraph('<b>Price (₹)</b>', styles['Normal']), 
         Paragraph('<b>Disc. (₹)</b>', styles['Normal']), 
         Paragraph('<b>Total (₹)</b>', styles['Normal'])]
    ]
    
    for item in sale_data['items']:
        table_data.append([
            Paragraph(item['name'], info_style),
            Paragraph(str(item['quantity']), info_style),
            Paragraph(f"{item['price']:,.2f}", info_style),
            Paragraph(f"{item.get('discount', 0):,.2f}", info_style),
            Paragraph(f"<b>{item['total']:,.2f}</b>", info_style)
        ])
    
    # Create table
    col_widths = [3*inch, 0.7*inch, 1.1*inch, 1.1*inch, 1.1*inch]
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
    summary_data.append(['Subtotal:', f"₹ {sale_data['subtotal']:,.2f}"])
    
    if sale_data.get('item_discounts', 0) > 0:
        summary_data.append(['Item Discounts:', f"- ₹ {sale_data['item_discounts']:,.2f}"])
    
    if sale_data.get('total_discount', 0) > 0:
        summary_data.append(['Additional Discount:', f"- ₹ {sale_data['total_discount']:,.2f}"])
    
    if sale_data.get('tax_amount', 0) > 0:
        summary_data.append(['Tax:', f"+ ₹ {sale_data['tax_amount']:,.2f}"])
    
    # Add separator line
    summary_data.append(['', ''])
    summary_data.append([Paragraph('<b>GRAND TOTAL:</b>', styles['Normal']), 
                        Paragraph(f"<b>₹ {sale_data['total_amount']:,.2f}</b>", styles['Normal'])])
    
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
    elements.append(Paragraph("Thank You for Your Business!", footer_style))
    elements.append(Paragraph("We appreciate your trust in BizTracker PRO", footer_note_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("This is a computer-generated receipt and does not require a signature.", footer_note_style))
    
    # Build PDF with custom canvas
    doc.build(elements, canvasmaker=NumberedCanvas)
    
    # Reset buffer position
    buffer.seek(0)
    return buffer

from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import datetime
from typing import List, Dict

def generate_sale_receipt_pdf(sale_data: Dict) -> BytesIO:
    """
    Generate a PDF receipt for a sale.
    
    Args:
        sale_data: Dictionary containing sale information
    
    Returns:
        BytesIO: PDF file in memory
    """
    buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    # Container for elements
    elements = []
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#6b7280'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    
    # Header
    elements.append(Paragraph("BizTracker PRO", title_style))
    elements.append(Paragraph("Sales Receipt", subtitle_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Invoice details at top
    invoice_date = sale_data['date']
    if isinstance(invoice_date, str):
        invoice_date = datetime.fromisoformat(invoice_date.replace('Z', '+00:00'))
    
    invoice_info = f"""
    <b>Invoice Number:</b> {sale_data['invoice_number']}<br/>
    <b>Date:</b> {invoice_date.strftime('%d-%b-%Y')}<br/>
    <b>Time:</b> {invoice_date.strftime('%I:%M %p')}<br/>
    <b>Payment Method:</b> {sale_data.get('payment_method', 'Cash')}
    """
    
    if sale_data.get('customer_name'):
        invoice_info += f"<br/><b>Customer:</b> {sale_data['customer_name']}"
    
    elements.append(Paragraph(invoice_info, styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Products heading
    elements.append(Paragraph("Products", heading_style))
    
    # Items table
    table_data = [
        ['Item', 'Qty', 'Price (₹)', 'Disc. (₹)', 'Total (₹)']
    ]
    
    for item in sale_data['items']:
        table_data.append([
            Paragraph(item['name'], styles['Normal']),
            str(item['quantity']),
            f"{item['price']:,.2f}",
            f"{item.get('discount', 0):,.2f}",
            f"{item['total']:,.2f}"
        ])
    
    # Create table
    col_widths = [3.2*inch, 0.6*inch, 1*inch, 1*inch, 1*inch]
    items_table = Table(table_data, colWidths=col_widths)
    
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        
        # Data rows
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#1e40af')),
        
        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Cart Summary
    elements.append(Paragraph("Cart Summary", heading_style))
    
    summary_data = []
    summary_data.append(['Subtotal:', f"₹{sale_data['subtotal']:,.2f}"])
    
    if sale_data.get('item_discounts', 0) > 0:
        summary_data.append(['Item Discounts:', f"- ₹{sale_data['item_discounts']:,.2f}"])
    
    if sale_data.get('total_discount', 0) > 0:
        summary_data.append(['Additional Discount:', f"- ₹{sale_data['total_discount']:,.2f}"])
    
    if sale_data.get('tax_amount', 0) > 0:
        summary_data.append(['Tax:', f"+ ₹{sale_data['tax_amount']:,.2f}"])
    
    summary_data.append(['<b>Grand Total:</b>', f"<b>₹{sale_data['total_amount']:,.2f}</b>"])
    
    summary_table = Table(summary_data, colWidths=[5*inch, 1.8*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -2), 11),
        ('FONTSIZE', (0, -1), (-1, -1), 14),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#1e40af')),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#1e40af')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, -1), (-1, -1), 12),
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        alignment=TA_CENTER,
        spaceAfter=6
    )
    
    elements.append(Paragraph("Thank you for your business!", footer_style))
    elements.append(Paragraph("Powered by BizTracker PRO", footer_style))
    
    # Build PDF
    doc.build(elements)
    
    # Reset buffer position
    buffer.seek(0)
    return buffer
