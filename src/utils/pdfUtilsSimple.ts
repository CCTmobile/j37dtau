import jsPDF from 'jspdf';

interface OrderData {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: string;
  order_date: string;
  shipping_address?: any;
  order_items?: any[];
  payment_method?: string;
}

/**
 * Generate PDF invoice using pure jsPDF methods (no html2canvas)
 */
export const generateInvoicePDFSimple = async (order: OrderData): Promise<void> => {
  try {
    const pdf = new jsPDF();
    let yPosition = 20;

    // Company Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Rosemama', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('CLOTHING STORE', 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('New Rd, Carlswald, Midrand, 1684', 20, yPosition);
    yPosition += 5;
    pdf.text('info@rosemama.store | +27 63 470 8046', 20, yPosition);
    yPosition += 15;

    // Draw header line
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(1);
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 20;

    // Invoice Details Section - Side by side
    const leftX = 20;
    const rightX = 110;
    let currentY = yPosition;

    // Left side - Invoice Details
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Details', leftX, currentY);
    currentY += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice Number: INV-${order.order_id.slice(-8).toUpperCase()}`, leftX, currentY);
    currentY += 6;
    pdf.text(`Order ID: ${order.order_id}`, leftX, currentY);
    currentY += 6;
    pdf.text(`Invoice Date: ${new Date(order.order_date).toLocaleDateString()}`, leftX, currentY);
    currentY += 6;

    // Status with colored background
    pdf.setFillColor(219, 234, 254);
    pdf.setTextColor(30, 64, 175);
    pdf.rect(leftX, currentY - 4, 25, 6, 'F');
    pdf.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, leftX, currentY);

    // Right side - Bill To
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To', rightX, yPosition);
    let rightY = yPosition + 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${order.customer_name}`, rightX, rightY);
    rightY += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.text(`${order.customer_email}`, rightX, rightY);
    rightY += 6;

    if (order.shipping_address) {
      pdf.text(`${order.shipping_address.address}`, rightX, rightY);
      rightY += 6;
      pdf.text(`${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}`, rightX, rightY);
      rightY += 6;
      pdf.text(`${order.shipping_address.country}`, rightX, rightY);
      rightY += 6;
      pdf.text(`📞 ${order.shipping_address.phone}`, rightX, rightY);
    }

    // Move to next section
    yPosition = Math.max(currentY + 10, rightY + 10);

    // Order Items Table
    if (order.order_items && order.order_items.length > 0) {
      // Table Header
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Order Items', 20, yPosition);
      yPosition += 8;

      // Table background
      pdf.setFillColor(249, 250, 251);
      pdf.rect(20, yPosition - 4, 170, 8, 'F');

      // Table headers
      pdf.setFontSize(10);
      pdf.text('Item', 25, yPosition);
      pdf.text('Qty', 125, yPosition);
      pdf.text('Price', 145, yPosition);
      pdf.text('Total', 175, yPosition);

      yPosition += 8;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.2);

      order.order_items.forEach((item: any, index: number) => {
        // Draw table row border
        pdf.line(20, yPosition + 6, 190, yPosition + 6);

        pdf.text(item.products?.name || 'Unknown Product', 25, yPosition);
        yPosition += 4;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(item.products?.category || 'N/A', 25, yPosition);
        yPosition += 2;

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.text(item.quantity.toString(), 125, yPosition);
        pdf.text(formatCurrency(item.price_at_purchase), 145, yPosition);
        pdf.text(formatCurrency(item.quantity * item.price_at_purchase), 175, yPosition);

        yPosition += 6;

        // Check if we need a new page
        if (yPosition > 260) {
          pdf.addPage();
          yPosition = 20;
        }
      });

      // Totals
      yPosition += 5;
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 10;

      // Payment Method and Totals - side by side
      const paymentX = 20;
      const totalsX = 110;

      // Payment Method
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Method', paymentX, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const paymentText = order.payment_method === 'cash-on-delivery' ? 'Cash on Delivery' :
                         order.payment_method === 'bank-transfer' ? 'Bank Transfer' :
                         order.payment_method === 'credit-card' ? 'Credit Card' :
                         'Payment Method Not Specified';
      pdf.text(paymentText, paymentX, yPosition);
      yPosition += 6;

      // Totals box
      let totalsY = yPosition - 8;
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.5);
      pdf.rect(totalsX, totalsY, 80, 30);

      // Totals content
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let totalY = totalsY + 8;
      pdf.text('Subtotal:', totalsX + 5, totalY);
      pdf.text(calculateSubtotal(order).toString(), totalsX + 70, totalY, { align: 'right' });
      totalY += 6;

      pdf.text('Shipping:', totalsX + 5, totalY);
      pdf.text('R150.00', totalsX + 70, totalY, { align: 'right' });
      totalY += 6;

      // Total line
      pdf.line(totalsX + 5, totalY, totalsX + 75, totalY);
      totalY += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Total:', totalsX + 5, totalY);
      pdf.text(formatCurrency(order.amount), totalsX + 70, totalY, { align: 'right' });
    }

    // Footer - move to bottom or next page if needed
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    } else {
      yPosition += 20;
    }

    // Footer
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'normal');

    const footerY = yPosition;
    pdf.text('Thank you for shopping with Rosemama! We appreciate your business.', 20, footerY);
    pdf.text('For any inquiries, please contact us at info@rosemama.store or call +27 63 470 8046', 20, footerY + 6);

    // Download the PDF
    const invoiceNumber = `INV-${order.order_id.slice(-8).toUpperCase()}`;
    pdf.save(`${invoiceNumber}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF invoice. Please try again.');
  }
};

/**
 * Helper function to calculate subtotal
 */
const calculateSubtotal = (order: OrderData): number => {
  if (!order.order_items) return order.amount;
  return order.order_items.reduce((total: number, item: any) =>
    total + (item.quantity * item.price_at_purchase), 0
  );
};

/**
 * Helper function to format currency
 */
const formatCurrency = (amount: number): string => {
  return `R${amount.toFixed(2)}`;
};

/**
 * Print the invoice directly (unchanged)
 */
export const printInvoice = async (order: OrderData): Promise<void> => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      throw new Error('Please allow popups for this site to print invoices.');
    }

    // Create the invoice HTML
    const invoiceHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; background: white; font-family: Arial, sans-serif;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">Rosemama</h1>
          <p style="font-size: 18px; color: #666;">CLOTHING STORE</p>
          <p style="font-size: 14px; color: #666;">
            New Rd, Carlswald, Midrand, 1684 | info@rosemama.store | +27 63 470 8046
          </p>
          <div style="border-top: 2px solid #3b82f6; margin-top: 20px;"></div>
        </div>

        <!-- Invoice Details -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="width: 48%;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px;">Invoice Details</h2>
            <p><strong>Invoice Number:</strong> INV-${order.order_id.slice(-8).toUpperCase()}</p>
            <p><strong>Order ID:</strong> ${order.order_id}</p>
            <p><strong>Invoice Date:</strong> ${new Date(order.order_date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${order.status}</span></p>
          </div>
          <div style="width: 48%;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px;">Bill To</h2>
            <p><strong>${order.customer_name}</strong></p>
            <p>${order.customer_email}</p>
            ${order.shipping_address ? `
              <p>${order.shipping_address.address}</p>
              <p>${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}</p>
              <p>${order.shipping_address.country}</p>
              <p>📞 ${order.shipping_address.phone}</p>
            ` : ''}
          </div>
        </div>

        <!-- Order Items -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e5e7eb;">
          <thead style="background: #f9fafb;">
            <tr>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Item</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items && order.order_items.length > 0 ?
              order.order_items.map((item: any) => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div>
                      <div style="font-weight: 500;">${item.products?.name || 'Unknown Product'}</div>
                      <div style="font-size: 12px; color: #666;">${item.products?.category || 'N/A'}</div>
                    </div>
                  </td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.price_at_purchase)}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formatCurrency(item.quantity * item.price_at_purchase)}</td>
                </tr>
              `).join('') :
              '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #666;">No items found in this order</td></tr>'
            }
          </tbody>
        </table>

        <!-- Totals -->
        <div style="display: flex; justify-content: space-between;">
          <div style="width: 48%;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Payment Method</h3>
            <p style="color: #666;">
              ${order.payment_method === 'cash-on-delivery' ? 'Cash on Delivery' :
                order.payment_method === 'bank-transfer' ? 'Bank Transfer' :
                order.payment_method === 'credit-card' ? 'Credit Card' :
                'Payment Method Not Specified'
              }
            </p>
          </div>
          <div style="width: 48%;">
            <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Subtotal:</span>
                <span>${formatCurrency(calculateSubtotal(order))}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Shipping:</span>
                <span>R150.00</span>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 8px 0;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
                <span>Total:</span>
                <span>${formatCurrency(order.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p style="color: #666; margin-bottom: 8px;">
            Thank you for shopping with Rosemama! We appreciate your business.
          </p>
          <p style="font-size: 12px; color: #666;">
            For any inquiries, please contact us at info@rosemama.store or call +27 63 470 8046
          </p>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.order_id}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body { font-family: Arial, sans-serif; }
            .invoice-container { max-width: 800px; margin: 0 auto; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            ${invoiceHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();

  } catch (error) {
    console.error('Error printing invoice:', error);
    throw error;
  }
};

/**
 * Show invoice in a modal for viewing
 */
export const viewInvoiceInModal = async (order: OrderData): Promise<void> => {
  const html = `
    <div style="max-width: 800px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
      <!-- Modern Header -->
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 25px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); margin-bottom: 25px;">
          <h1 style="font-size: 42px; font-weight: bold; color: white; margin-bottom: 8px;">ROSÉMAMA</h1>
          <p style="font-size: 20px; font-weight: 500; color: #fce7f3;">Premium Fashion & Lifestyle</p>
          <div style="width: 80px; height: 4px; background: white; margin: 15px auto 0; border-radius: 2px;"></div>
        </div>
        <div style="display: flex; justify-content: center; align-items: center; gap: 30px;">
          <div style="display: flex; align-items: center; color: #374151;">
            <svg style="width: 18px; height: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <span>New Rd, Carlswald, Midrand, 1684</span>
          </div>
          <div style="display: flex; align-items: center; color: #2563eb;">
            <svg style="width: 18px; height: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
            <span>+27 63 470 8046</span>
          </div>
          <div style="display: flex; align-items: center; color: #374151;">
            <svg style="width: 18px; height: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
            <span>info@rosemama.store</span>
          </div>
        </div>
      </div>

        <!-- Invoice Details -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="width: 48%;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px;">Invoice Details</h2>
            <p><strong>Invoice Number:</strong> INV-${order.order_id.slice(-8).toUpperCase()}</p>
            <p><strong>Order ID:</strong> ${order.order_id}</p>
            <p><strong>Invoice Date:</strong> ${new Date(order.order_date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${order.status}</span></p>
          </div>
          <div style="width: 48%;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px;">Bill To</h2>
            <p><strong>${order.customer_name}</strong></p>
            <p>${order.customer_email}</p>
            ${order.shipping_address ? `
              <p>${order.shipping_address.address}</p>
              <p>${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}</p>
              <p>${order.shipping_address.country}</p>
              <p>📞 ${order.shipping_address.phone}</p>
            ` : ''}
          </div>
        </div>

        <!-- Order Items -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e5e7eb;">
          <thead style="background: #f9fafb;">
            <tr>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Item</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items && order.order_items.length > 0 ?
              order.order_items.map((item: any) => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div>
                      <div style="font-weight: 500;">${item.products?.name || 'Unknown Product'}</div>
                      <div style="font-size: 12px; color: #666;">${item.products?.category || 'N/A'}</div>
                    </div>
                  </td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.price_at_purchase)}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formatCurrency(item.quantity * item.price_at_purchase)}</td>
                </tr>
              `).join('') :
              '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #666;">No items found in this order</td></tr>'
            }
          </tbody>
        </table>

        <!-- Totals -->
        <div style="display: flex; justify-content: space-between;">
          <div style="width: 48%;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Payment Method</h3>
            <p style="color: #666;">
              ${order.payment_method === 'cash-on-delivery' ? 'Cash on Delivery' :
                order.payment_method === 'bank-transfer' ? 'Bank Transfer' :
                order.payment_method === 'credit-card' ? 'Credit Card' :
                'Payment Method Not Specified'
              }
            </p>
          </div>
          <div style="width: 48%;">
            <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Subtotal:</span>
                <span>${formatCurrency(calculateSubtotal(order))}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Shipping:</span>
                <span>R150.00</span>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 8px 0;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
                <span>Total:</span>
                <span>${formatCurrency(order.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p style="color: #666; margin-bottom: 8px;">
            Thank you for shopping with Rosemama! We appreciate your business.
          </p>
          <p style="font-size: 12px; color: #666;">
            For any inquiries, please contact us at info@rosemama.store or call +27 63 470 8046
          </p>
        </div>
      </div>
    `;
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.zIndex = '9999';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = 'white';
  modalContent.style.maxWidth = '90vw';
  modalContent.style.maxHeight = '90vh';
  modalContent.style.overflow = 'auto';
  modalContent.style.borderRadius = '8px';
  modalContent.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
  modalContent.innerHTML = `
    <div style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 24px; font-weight: bold;">Invoice Preview</h2>
        <button onclick="this.closest('div').parentElement.remove()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
      ${html}
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);
};
