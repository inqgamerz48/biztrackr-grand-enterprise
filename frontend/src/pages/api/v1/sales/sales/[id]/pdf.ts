import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

function generateReceiptPDF(sale: any, settings: any): Buffer {
    const companyName = settings?.company_name || 'BizTrackr Enterprise';
    const companyAddress = settings?.company_address || 'N/A';
    const companyPhone = settings?.company_phone || 'N/A';
    const companyEmail = settings?.company_email || 'N/A';

    // Simple text-based PDF content layout
    const streamContent = `
BT
/F1 18 Tf
72 712 Td
(${companyName}) Tj
/F1 10 Tf
0 -15 Td
(Address: ${companyAddress}) Tj
0 -12 Td
(Phone: ${companyPhone} | Email: ${companyEmail}) Tj
0 -25 Td
/F1 14 Tf
(INVOICE: ${sale.invoice_number}) Tj
/F1 10 Tf
0 -20 Td
(Date: ${new Date(sale.date).toLocaleDateString()}) Tj
0 -12 Td
(Payment Method: ${sale.payment_method}) Tj
0 -12 Td
(Payment Status: ${sale.payment_status?.toUpperCase()}) Tj
0 -12 Td
(Customer: ${sale.customer?.name || 'Walk-in Customer'}) Tj
0 -25 Td
(Items Purchased:) Tj
${sale.items.map((item: any, index: number) => `0 -15 Td (${index + 1}. ${item.item?.name || 'Product'} | Qty: ${item.quantity} | Price: INR ${item.price} | Total: INR ${item.total}) Tj`).join('\n')}
0 -30 Td
/F1 12 Tf
(Subtotal: INR ${sale.total_amount - (sale.tax_amount ?? 0) + (sale.discount ?? 0)}) Tj
0 -15 Td
(Discount: INR ${sale.discount ?? 0}) Tj
0 -15 Td
(Tax Amount: INR ${sale.tax_amount ?? 0}) Tj
0 -20 Td
/F1 14 Tf
(Total Amount: INR ${sale.total_amount}) Tj
0 -30 Td
/F1 10 Tf
(Thank you for your business!) Tj
ET
`;

    const objects: string[] = [];
    objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`);
    objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj`);
    
    const streamLength = Buffer.byteLength(streamContent.trim());
    objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent.trim()}\nendstream\nendobj`);
    
    let offset = 9; // %PDF-1.4\n
    const offsets: number[] = [];
    let body = `%PDF-1.4\n`;
    for (let i = 0; i < objects.length; i++) {
        offsets.push(offset);
        body += objects[i] + '\n';
        offset += Buffer.byteLength(objects[i]) + 1;
    }
    
    const xrefOffset = offset;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 0; i < offsets.length; i++) {
        xref += String(offsets[i]).padStart(10, '0') + ` 00000 n \n`;
    }
    
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    
    return Buffer.from(body + xref + trailer, 'binary');
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const { id } = req.query;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    const saleId = parseInt(id as string);
    if (isNaN(saleId)) {
        return res.status(400).json({ detail: 'Invalid sale ID' });
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    try {
        const sale = await prisma.sale.findFirst({
            where: { id: saleId, tenant_id: tenantId },
            include: {
                customer: true,
                items: {
                    include: {
                        item: true
                    }
                }
            }
        });

        if (!sale) {
            return res.status(404).json({ detail: 'Sale not found' });
        }

        const settings = await prisma.settings.findFirst({
            where: { tenant_id: tenantId }
        });

        const pdfBuffer = generateReceiptPDF(sale, settings);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${sale.invoice_number}.pdf`);
        return res.send(pdfBuffer);
    } catch (err: any) {
        console.error('GENERATE SALE PDF ERROR:', err);
        return res.status(500).json({ detail: 'Failed to generate invoice receipt PDF' });
    }
};

export default withAuth(handler);
