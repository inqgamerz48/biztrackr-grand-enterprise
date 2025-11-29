from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
from typing import Dict
import qrcode

class NumberedCanvas(canvas.Canvas):
    """Custom canvas to add page numbers and elegant borders"""
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
        """Draw an elegant double border around the page"""
        self.saveState()
        # Outer border
        self.setStrokeColor(colors.HexColor('#1e40af'))
        self.setLineWidth(3)
        self.rect(25, 25, A4[0] - 50, A4[1] - 50)
        # Inner border
        self.setStrokeColor(colors.HexColor('#60a5fa'))
        self.setLineWidth(1)
        self.rect(30, 30, A4[0] - 60, A4[1] - 60)
        self.restoreState()

    def draw_page_number(self, page_count):
        """Add page number at bottom with elegant styling"""
        self.saveState()
        self.setFont('Helvetica', 9)
        self.setFillColor(colors.HexColor('#6b7280'))
        page_num = f"Page {self._pageNumber} of {page_count}"
        self.drawCentredString(A4[0] / 2, 12*mm, page_num)
        self.restoreState()

def generate_qr_code(data: str) -> BytesIO:
    """Generate QR code image"""
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer

def generate_sale_receipt_pdf(sale_data: Dict, db_session=None) -> BytesIO:
    """
    Generate an enhanced professional PDF receipt for a sale.
    
    Args:
        sale_data: Dictionary containing sale information
        db_session: Optional database session to fetch settings
    
    Returns:
        BytesIO: PDF file in memory
    """
    buffer = BytesIO()
    
    # Fetch company info from settings if available
    company_name = "BizTracker PRO"
    company_tagline = "Your Complete Business Management Solution"
    company_address = "123 Business Street, Mumbai, Maharashtra 400001"
    company_phone = "+91 98765 43210"
    company_email = "support@biztrackerpro.com"
    company_website = "www.biztrackerpro.com"
    footer_text = "Thank you for your business!"
    terms = None
    
    if db_session:
        try:
            from app.models.settings import Settings
            settings = db_session.query(Settings).first()
            if settings:
                company_name = settings.company_name or company_name
                company_address = settings.company_address or company_address
                company_phone = settings.company_phone or company_phone
                company_email = settings.company_email or company_email
                company_website = settings.company_website or company_website
                footer_text = settings.footer_text or footer_text
                terms = settings.terms_and_conditions
        except Exception:
            pass  # Use defaults if settings not available
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45,
        title=f"Receipt - {sale_data['invoice_number']}",
        author=company_name,
        subject=f"Sales Receipt for Invoice {sale_data['invoice_number']}"
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # ===== CUSTOM STYLES =====
    company_style = ParagraphStyle(
        'Company',
        parent=styles['Heading1'],
        fontSize=36,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=2,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=40
    )
    
    tagline_style = ParagraphStyle(
        'Tagline',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6b7280'),
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique'
    )
    
    receipt_title_style = ParagraphStyle(
        'ReceiptTitle',
        parent=styles['Heading2'],
        fontSize=20,
        textColor=colors.white,
        spaceAfter=0,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        backColor=colors.HexColor('#1e40af'),
        borderPadding=10
    )
    
    section_heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading3'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=10,
        spaceBefore=6,
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
    
    # ===== COMPANY HEADER WITH QR CODE =====
    # Generate QR code for invoice verification
    qr_data = f"Invoice: {sale_data['invoice_number']} | Total: ₹{sale_data['total_amount']:,.2f}"
    qr_buffer = generate_qr_code(qr_data)
    qr_image = Image(qr_buffer, width=0.8*inch, height=0.8*inch)
    
    # Header table with company name and QR code
    header_data = [[
        Paragraph(company_name, company_style),
        qr_image
    ]]
    
    header_table = Table(header_data, colWidths=[6*inch, 1*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT')
    ]))
    
    elements.append(header_table)
    elements.append(Paragraph(company_tagline, tagline_style))
    elements.append(Spacer(1, 0.05*inch))
    
    # Contact info
    contact_info = f"""
    <para align=center>
    <font size=8 color=#6b7280>
    📍 {company_address}<br/>
    📞 {company_phone} | ✉ {company_email} | 🌐 {company_website}
    </font>
    </para>
    """
    elements.append(Paragraph(contact_info, styles['Normal']))
    elements.append(Spacer(1, 0.15*inch))
    
    # Receipt title bar
    elements.append(Paragraph("SALES RECEIPT", receipt_title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # ===== INVOICE DETAILS =====
    invoice_date = sale_data['date']
    if isinstance(invoice_date, str):
        invoice_date = datetime.fromisoformat(invoice_date.replace('Z', '+00:00'))
    
    invoice_data = [
        ['Invoice Number:', sale_data['invoice_number'], 'Date:', invoice_date.strftime('%d-%b-%Y')],
        ['Payment Method:', sale_data.get('payment_method', 'Cash'), 'Time:', invoice_date.strftime('%I:%M %p')]
    ]
    
    if sale_data.get('customer_name'):
        invoice_data.append(['Customer:', sale_data['customer_name'], '', ''])
    
    invoice_table = Table(invoice_data, colWidths=[1.6*inch, 2.1*inch, 0.9*inch, 1.4*inch])
    invoice_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#e5e7eb')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb'))
    ]))
    
    elements.append(invoice_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # ===== ITEMS TABLE =====
    elements.append(Paragraph("ITEMS PURCHASED", section_heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    table_data = [[
        Paragraph('<b>Item Description</b>', styles['Normal']),
        Paragraph('<b>Qty</b>', styles['Normal']),
        Paragraph('<b>Price (₹)</b>', styles['Normal']),
        Paragraph('<b>Disc. (₹)</b>', styles['Normal']),
        Paragraph('<b>Total (₹)</b>', styles['Normal'])
    ]]
    
    for item in sale_data['items']:
        table_data.append([
            Paragraph(item['name'], info_style),
            Paragraph(str(item['quantity']), info_style),
            Paragraph(f"{item['price']:,.2f}", info_style),
            Paragraph(f"{item.get('discount', 0):,.2f}", info_style),
            Paragraph(f"<b>{item['total']:,.2f}</b>", info_style)
        ])
    
    items_table = Table(table_data, colWidths=[3.1*inch, 0.7*inch, 1.1*inch, 1.1*inch, 1*inch], repeatRows=1)
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        # Data rows
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#1e40af')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#1e40af')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # ===== PAYMENT SUMMARY WITH TAX =====
    elements.append(Paragraph("PAYMENT SUMMARY", section_heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    summary_data = []
    summary_data.append(['Subtotal:', f"₹ {sale_data['subtotal']:,.2f}"])
    
    if sale_data.get('item_discounts', 0) > 0:
        summary_data.append(['Item Discounts:', f"- ₹ {sale_data['item_discounts']:,.2f}"])
    
    if sale_data.get('total_discount', 0) > 0:
        summary_data.append(['Additional Discount:', f"- ₹ {sale_data['total_discount']:,.2f}"])
    
    # Enhanced tax display with percentage
    if sale_data.get('tax_amount', 0) > 0:
        tax_rate = sale_data.get('tax_rate', 0)
        if tax_rate > 0:
            tax_label = f'Tax ({tax_rate*100:.1f}%):'
        else:
            tax_label = 'Tax:'
        summary_data.append([tax_label, f"+ ₹ {sale_data['tax_amount']:,.2f}"])
    
    # Separator
    summary_data.append(['', ''])
    summary_data.append([
        Paragraph('<b>GRAND TOTAL:</b>', styles['Normal']),
        Paragraph(f"<b>₹ {sale_data['total_amount']:,.2f}</b>", styles['Normal'])
    ])
    
    summary_table = Table(summary_data, colWidths=[5.3*inch, 1.7*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -3), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -3), 11),
        ('FONTSIZE', (0, -1), (-1, -1), 18),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#1e40af')),
        ('LINEABOVE', (0, -1), (-1, -1), 2.5, colors.HexColor('#1e40af')),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, -1), (-1, -1), 14),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 14),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#eff6ff')),
        ('BOX', (0, -1), (-1, -1), 2, colors.HexColor('#1e40af'))
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # ===== PROFESSIONAL FOOTER =====
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1e40af'),
        alignment=TA_CENTER,
        spaceAfter=5,
        fontName='Helvetica-Bold'
    )
    
    footer_note_style = ParagraphStyle(
        'FooterNote',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER,
        leading=11
    )
    
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#e5e7eb')))
    elements.append(Spacer(1, 0.15*inch))
    elements.append(Paragraph(footer_text, footer_style))
    elements.append(Paragraph(f"We appreciate your trust in {company_name}", footer_note_style))
    elements.append(Spacer(1, 0.1*inch))
    
    if terms:
        elements.append(Paragraph(f"<b>Terms:</b> {terms[:200]}", footer_note_style))
        elements.append(Spacer(1, 0.05*inch))
    
    elements.append(Paragraph("This is a computer-generated receipt. For queries, contact support.", footer_note_style))
    elements.append(Spacer(1, 0.15*inch))
    
    # Authorized signature line
    sig_style = ParagraphStyle(
        'Signature',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#374151'),
        alignment=TA_RIGHT
    )
    elements.append(Paragraph("__________________________", sig_style))
    elements.append(Paragraph("<i>Authorized Signature</i>", sig_style))
    
    # Build PDF
    doc.build(elements, canvasmaker=NumberedCanvas)
    
    buffer.seek(0)
    return buffer
