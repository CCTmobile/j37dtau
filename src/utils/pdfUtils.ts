import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
 * Generate PDF invoice from order data
 */
export const generateInvoicePDF = async (order: OrderData): Promise<void> => {
  try {
    // Create a temporary div to render the invoice
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    document.body.appendChild(tempDiv);

    // Generate invoice HTML directly instead of using React component
    const invoiceHTML = await generateInvoiceHTML(order);

    // Set the HTML content and basic styling that html2canvas can handle
    tempDiv.innerHTML = invoiceHTML;
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.color = '#000000';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.lineHeight = '1.6';

    // Add some basic CSS that html2canvas can handle
    const style = document.createElement('style');
    style.textContent = `
      .invoice-container { max-width: 800px; margin: 0 auto; padding: 20px; background: white; }
      .text-center { text-align: center; }
      .mb-8 { margin-bottom: 30px; }
      .mb-3 { margin-bottom: 15px; }
      .mt-8 { margin-top: 30px; }
      .pt-6 { padding-top: 20px; }
      .text-lg { font-size: 18px; }
      .text-xl { font-size: 20px; }
      .text-4xl { font-size: 36px; font-weight: bold; }
      .font-bold { font-weight: bold; }
      .font-medium { font-weight: 500; }
      .font-semibold { font-weight: 600; }
      .text-muted-foreground { color: #666666; }
      .border-t { border-top: 1px solid #e5e7eb; }
      .grid { display: grid; }
      .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .gap-8 { gap: 30px; }
      .gap-2 { gap: 8px; }
      .px-4 { padding-left: 15px; padding-right: 15px; }
      .py-3 { padding-top: 12px; padding-bottom: 12px; }
      .border { border: 1px solid #e5e7eb; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      .bg-gray-50 { background-color: #f9fafb; }
      .table { display: table; width: 100%; }
      .table-header { background-color: #f9fafb; }
      .table-row { display: table-row; }
      .table-cell { display: table-cell; padding: 12px; border-bottom: 1px solid #e5e7eb; }
      .table-cell-left { text-align: left; }
      .table-cell-right { text-align: right; }
    `;
    tempDiv.appendChild(style);

    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Use jsPDF's html method for more reliable PDF generation
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Wait for DOM to be fully ready
    await new Promise(resolve => {
      // Make sure all styles are applied
      const checkStyles = () => {
        if (document.readyState === 'complete') {
          resolve(true);
        } else {
          setTimeout(checkStyles, 50);
        }
      };
      checkStyles();
    });

    // Add content to PDF using html method
    await new Promise((resolve) => {
      pdf.html(tempDiv, {
        callback: function (doc) {
          resolve(doc);
        },
        x: 10,
        y: 10,
        width: 190, // A4 width minus margins
        windowWidth: 800,
        margin: [10, 10, 10, 10] // top, right, bottom, left margins
      });
    });

    // Clean up
    document.body.removeChild(tempDiv);

    // Download the PDF
    const invoiceNumber = `INV-${order.order_id.slice(-8).toUpperCase()}`;
    pdf.save(`${invoiceNumber}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF invoice. Please try again.');
  }
};

/**
 * Print the invoice directly
 */
export const printInvoice = async (order: OrderData): Promise<void> => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      throw new Error('Please allow popups for this site to print invoices.');
    }

    // Create the invoice HTML
    const invoiceHTML = await generateInvoiceHTML(order);

    // Write to the print window
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
 * Generate HTML string for invoice
 */
export const generateInvoiceHTML = async (order: OrderData): Promise<string> => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateSubtotal = () => {
    if (!order.order_items) return order.amount;
    return order.order_items.reduce((total: number, item: any) =>
      total + (item.quantity * item.price_at_purchase), 0
    );
  };

  const subtotal = calculateSubtotal();
  const shippingFee = 150;
  const total = order.amount;

  const html = `
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
          <p><strong>Invoice Date:</strong> ${formatDate(order.order_date)}</p>
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
            ${order.payment_method === 'cash-on-delivery' ? '💰 Cash on Delivery' :
              order.payment_method === 'bank-transfer' ? '🏦 Bank Transfer' :
              order.payment_method === 'credit-card' ? '💳 Credit Card' :
              'Payment Method Not Specified'
            }
          </p>
        </div>
        <div style="width: 48%;">
          <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Subtotal:</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Shipping:</span>
              <span>${formatCurrency(shippingFee)}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 8px 0;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
              <span>Total:</span>
              <span>${formatCurrency(total)}</span>
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

  return html;
};

/**
 * Show invoice in a modal for viewing
 */
export const viewInvoiceInModal = async (order: OrderData): Promise<void> => {
  const html = await generateInvoiceHTML(order);
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
