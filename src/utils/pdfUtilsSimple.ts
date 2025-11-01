import jsPDF from 'jspdf';
import { Order } from '../types/invoice';
import { formatCurrencyZAR } from './currency';

/**
 * Generate PDF invoice with beautiful dark theme styling
 */
export const generateInvoicePDFSimple = async (order: Order): Promise<void> => {
  try {
    const pdf = new jsPDF();
    
    // Define beautiful dark theme colors
    const colors = {
      background: [40, 44, 52] as const,      // Dark charcoal
      primary: [255, 255, 255] as const,      // White text
      secondary: [156, 163, 175] as const,    // Light gray, 175] as const,    // Light gray
      accent: [239, 68, 68] as const,         // Red accent
      accent2: [59, 130, 246] as const,       // Blue accent
      cardBg: [55, 65, 81] as const,          // Card background
      border: [75, 85, 99] as const,          // Border color
      success: [34, 197, 94] as const,        // Green
      warning: [251, 191, 36] as const,       // Yellow
    };

    // Set page background to dark charcoal
    pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    pdf.rect(0, 0, 210, 297, 'F'); // A4 page dimensions

    let yPosition = 25;

    // Elegant header with gradient-like effect using overlapping shapes
    pdf.setFillColor(229, 62, 132); // Rose
    pdf.rect(0, 0, 210, 35, 'F');
    pdf.setFillColor(219, 39, 119); // Slightly darker rose
    pdf.rect(0, 25, 210, 10, 'F');

    // Company name in white
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ROSÉMAMA', 20, 20);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Premium Fashion & Lifestyle', 20, 30);

    yPosition = 50;

    // Contact info in elegant white text
    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.setFontSize(9);
    pdf.text('📍 New Rd, Carlswald, Midrand, 1684', 20, yPosition);
    pdf.text('📞 +27 73 551 4705', 20, yPosition + 5);
    pdf.text('✉️ info@rosemama.store', 20, yPosition + 10);

    yPosition += 25;

    // Modern card-style sections
    const createCard = (x: number, y: number, width: number, height: number) => {
      pdf.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, height);
    };

    // Invoice Details Card
    createCard(20, yPosition, 85, 45);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Details', 25, yPosition + 8);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    let detailY = yPosition + 16;
    pdf.text(`Invoice Number:`, 25, detailY);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.text(`INV-${order.order_id.slice(-8).toUpperCase()}`, 25, detailY + 4);
    
    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.text(`Order ID:`, 25, detailY + 12);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.text(`${order.order_id.slice(-12)}`, 25, detailY + 16);
    
    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.text(`Invoice Date:`, 25, detailY + 24);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.text(`${new Date(order.order_date).toLocaleDateString()}`, 25, detailY + 28);

    // Status badge with color coding
    const statusColors: Record<string, readonly [number, number, number]> = {
      pending: colors.warning,
      processing: colors.accent2,
      shipped: colors.accent2,
      delivered: colors.success,
      cancelled: colors.accent
    };
    
    const statusColor = statusColors[order.status] || colors.secondary;
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.rect(67, detailY + 32, 25, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(order.status.toUpperCase(), 69, detailY + 37);

    // Bill To Card
    createCard(110, yPosition, 80, 45);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To', 115, yPosition + 8);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(order.customer_name, 115, yPosition + 18);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.text(order.customer_email, 115, yPosition + 25);

    if (order.shipping_address) {
      pdf.text(order.shipping_address.address, 115, yPosition + 32);
      pdf.text(`${order.shipping_address.city}, ${order.shipping_address.state}`, 115, yPosition + 37);
      pdf.text(`${order.shipping_address.zipCode} ${order.shipping_address.country}`, 115, yPosition + 42);
    }

    yPosition += 60;

    // Order Items Section with modern table
    if (order.order_items && order.order_items.length > 0) {
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Order Items', 20, yPosition);
      yPosition += 15;

      // Modern table header
      pdf.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
      pdf.rect(20, yPosition - 5, 170, 12, 'F');
      
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ITEM', 25, yPosition);
      pdf.text('QTY', 125, yPosition, { align: 'center' });
      pdf.text('PRICE', 150, yPosition, { align: 'center' });
      pdf.text('TOTAL', 180, yPosition, { align: 'right' });

      yPosition += 12;

      // Table rows with alternating backgrounds
      pdf.setFont('helvetica', 'normal');
      order.order_items.forEach((item: any, index: number) => {
        // Alternating row background
        if (index % 2 === 0) {
          pdf.setFillColor(45, 55, 72); // Slightly lighter than card
          pdf.rect(20, yPosition - 3, 170, 14, 'F');
        }

        pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        pdf.setFontSize(9);
        
        // Product name (truncated if too long)
        const productName = (item.products?.name || 'Unknown Product').substring(0, 30);
        pdf.text(productName, 25, yPosition + 3);
        
        // Category in smaller gray text
        pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        pdf.setFontSize(7);
        pdf.text(item.products?.category || 'N/A', 25, yPosition + 8);

        // Numbers
        pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        pdf.setFontSize(9);
        pdf.text(item.quantity.toString(), 125, yPosition + 3, { align: 'center' });
        pdf.text(formatCurrencyZAR(item.price_at_purchase), 150, yPosition + 3, { align: 'center' });
        pdf.text(formatCurrencyZAR(item.quantity * item.price_at_purchase), 180, yPosition + 3, { align: 'right' });

        yPosition += 14;

        // Page break check
        if (yPosition > 250) {
          pdf.addPage();
          pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
          pdf.rect(0, 0, 210, 297, 'F');
          yPosition = 20;
        }
      });

      yPosition += 10;

      // Totals section with modern styling
      createCard(110, yPosition, 80, 35);
      
      pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      pdf.setFontSize(9);
      let totalY = yPosition + 10;
      
      pdf.text('Subtotal:', 115, totalY);
      pdf.text(formatCurrencyZAR(calculateSubtotal(order)), 185, totalY, { align: 'right' });
      totalY += 8;

      pdf.text('Shipping:', 115, totalY);
      pdf.text(formatCurrencyZAR(150), 185, totalY, { align: 'right' });
      totalY += 8;

      // Total with accent
      pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      pdf.line(115, totalY, 185, totalY);
      totalY += 8;

      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL:', 115, totalY);
      pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      pdf.text(formatCurrencyZAR(order.amount), 185, totalY, { align: 'right' });

      // Payment method
      yPosition += 45;
      pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const paymentText = order.payment_method === 'cash-on-delivery' ? '💰 Cash on Delivery' :
                         order.payment_method === 'bank-transfer' ? '🏦 Bank Transfer' :
                         order.payment_method === 'credit-card' ? '💳 Credit Card' :
                         'Payment Method Not Specified';
      pdf.text(`Payment Method: ${paymentText}`, 20, yPosition);
    }

    // Footer section
    if (yPosition > 250) {
      pdf.addPage();
      pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
      pdf.rect(0, 0, 210, 297, 'F');
      yPosition = 20;
    } else {
      yPosition = 270; // Fixed footer position
    }

    // Elegant footer
    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Thank you for shopping with Rosémama! We appreciate your business.', 20, yPosition);
    pdf.setFontSize(8);
    pdf.text('For any inquiries, please contact us at info@rosemama.store or call +27 73 551 4705', 20, yPosition + 6);

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
const calculateSubtotal = (order: Order): number => {
  if (!order.order_items) return order.amount;
  return order.order_items.reduce((total: number, item: any) =>
    total + (item.quantity * item.price_at_purchase), 0
  );
};

/**
 * Helper function to format currency
 */
// Deprecated local currency helper kept for backward compatibility (not used)
const formatCurrency = (amount: number): string => formatCurrencyZAR(amount);

/**
 * Get status color for PDFs (inline version for string interpolation)
 */
const getStatusColorInline = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: 'rgb(251, 191, 36)',      // amber-400
    processing: 'rgb(59, 130, 246)',   // blue-500
    shipped: 'rgb(168, 85, 247)',      // purple-500
    delivered: 'rgb(34, 197, 94)',     // green-500
    cancelled: 'rgb(239, 68, 68)',     // red-500
  };
  return statusColors[status.toLowerCase()] || 'rgb(107, 114, 128)'; // gray-500 as default
};

/**
 * Get status color for PDFs (function version for jsPDF)
 */
const getStatusColor = (status: string): [number, number, number] => {
  const statusColors: Record<string, [number, number, number]> = {
    pending: [251, 191, 36] as const,      // amber-400
    processing: [59, 130, 246] as const,   // blue-500
    shipped: [168, 85, 247] as const,      // purple-500
    delivered: [34, 197, 94] as const,     // green-500
    cancelled: [239, 68, 68] as const,     // red-500
  };
  return statusColors[status.toLowerCase()] || [107, 114, 128] as const; // gray-500 as default
};

/**
 * Print the invoice with beautiful dark theme styling
 */
export const printInvoice = async (order: Order): Promise<void> => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      throw new Error('Please allow popups for this site to print invoices.');
    }

    // Create the invoice HTML with dark theme
    const invoiceHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 15px; background: rgb(40, 44, 52); color: rgb(255, 255, 255); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; min-height: 100vh; display: flex; flex-direction: column;">
        <!-- Main Content Area -->
        <div style="flex: 1;">
          <!-- Compact Header with Gradient -->
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="background: linear-gradient(135deg, rgba(244, 63, 94, 1) 0%, rgba(219, 39, 119, 1) 100%); padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); margin-bottom: 15px;">
              <h1 style="font-size: 28px; font-weight: bold; color: white; margin: 0 0 5px 0; letter-spacing: 1px;">ROSÉMAMA</h1>
              <p style="font-size: 14px; font-weight: 500; color: rgba(255, 255, 255, 0.9); margin: 0;">Premium Fashion & Lifestyle</p>
            </div>
            
            <!-- Contact Information with Icons -->
            <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; font-size: 12px;">
              <div style="display: flex; align-items: center; color: rgba(255, 255, 255, 0.8);">
                <span style="margin-right: 6px; font-weight: bold;">&bull;</span>
                <span>New Rd, Carlswald, Midrand, 1684</span>
              </div>
              <div style="display: flex; align-items: center; color: rgba(244, 63, 94, 1);">
                <span style="margin-right: 6px; font-weight: bold;">Tel:</span>
                <span>+27 73 551 4705</span>
              </div>
              <div style="display: flex; align-items: center; color: rgba(255, 255, 255, 0.8);">
                <span style="margin-right: 6px; font-weight: bold;">@</span>
                <span>info@rosemama.store</span>
              </div>
            </div>
          </div>

        <!-- Invoice Details Cards -->
        <div style="display: flex; gap: 30px; margin-bottom: 40px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px; background: rgb(55, 65, 81); padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="font-size: 22px; font-weight: bold; margin: 0 0 20px 0; color: rgb(244, 63, 94);">Invoice Details</h2>
            <div style="space-y: 12px;">
              <p style="margin: 8px 0; color: rgba(255, 255, 255, 0.9);"><strong style="color: white;">Invoice Number:</strong> INV-${order.order_id.slice(-8).toUpperCase()}</p>
              <p style="margin: 8px 0; color: rgba(255, 255, 255, 0.9);"><strong style="color: white;">Order ID:</strong> ${order.order_id}</p>
              <p style="margin: 8px 0; color: rgba(255, 255, 255, 0.9);"><strong style="color: white;">Invoice Date:</strong> ${new Date(order.order_date).toLocaleDateString()}</p>
              <p style="margin: 8px 0;"><strong style="color: white;">Status:</strong> 
                <span style="background: ${getStatusColor(order.status)}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${order.status.toUpperCase()}</span>
              </p>
            </div>
          </div>
          
          <div style="flex: 1; min-width: 250px; background: rgb(55, 65, 81); padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="font-size: 22px; font-weight: bold; margin: 0 0 20px 0; color: rgb(244, 63, 94);">Bill To</h2>
            <div style="space-y: 8px;">
              <p style="margin: 8px 0; font-weight: bold; color: white; font-size: 16px;">${order.customer_name}</p>
              <p style="margin: 8px 0; color: rgba(255, 255, 255, 0.8);">${order.customer_email}</p>
              ${order.shipping_address ? `
                <p style="margin: 8px 0; color: rgba(255, 255, 255, 0.8);">${order.shipping_address.address}</p>
                <p style="margin: 8px 0; color: rgba(255, 255, 255, 0.8);">${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}</p>
                <p style="margin: 8px 0; color: rgba(255, 255, 255, 0.8);">${order.shipping_address.country}</p>
                <p style="margin: 8px 0; color: rgba(244, 63, 94, 1);"><strong>Tel:</strong> ${order.shipping_address.phone}</p>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Order Items Table -->
        <div style="background: rgb(55, 65, 81); border-radius: 8px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(135deg, rgba(244, 63, 94, 1) 0%, rgba(219, 39, 119, 1) 100%);">
                <th style="padding: 10px 12px; text-align: left; color: white; font-weight: 600; font-size: 12px;">ITEM</th>
                <th style="padding: 10px 12px; text-align: right; color: white; font-weight: 600; font-size: 12px;">QTY</th>
                <th style="padding: 10px 12px; text-align: right; color: white; font-weight: 600; font-size: 12px;">PRICE</th>
                <th style="padding: 10px 12px; text-align: right; color: white; font-weight: 600; font-size: 12px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items && order.order_items.length > 0 ?
                order.order_items.map((item: any, index: number) => `
                  <tr style="background: ${index % 2 === 0 ? 'rgb(55, 65, 81)' : 'rgb(45, 55, 72)'}; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <td style="padding: 10px 12px;">
                      <div>
                        <div style="font-weight: 600; color: white; font-size: 13px;">${item.products?.name || 'Unknown Product'}</div>
                        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6); margin-top: 2px;">${item.products?.category || 'N/A'}</div>
                      </div>
                    </td>
                    <td style="padding: 10px 12px; text-align: right; color: rgba(255, 255, 255, 0.9); font-weight: 500; font-size: 13px;">${item.quantity}</td>
                    <td style="padding: 10px 12px; text-align: right; color: rgba(255, 255, 255, 0.9); font-size: 13px;">${formatCurrency(item.price_at_purchase)}</td>
                    <td style="padding: 10px 12px; text-align: right; color: white; font-weight: 600; font-size: 13px;">${formatCurrency(item.quantity * item.price_at_purchase)}</td>
                  </tr>
                `).join('') :
                '<tr><td colspan="4" style="padding: 15px; text-align: center; color: rgba(255, 255, 255, 0.6);">No items found in this order</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <!-- Payment and Totals Section -->
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px; background: rgb(55, 65, 81); padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 10px 0; color: rgb(244, 63, 94);">Payment Method</h3>
            <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">
              ${order.payment_method === 'cash-on-delivery' ? 'Cash on Delivery' :
                order.payment_method === 'bank-transfer' ? 'Bank Transfer' :
                order.payment_method === 'credit-card' ? 'Credit Card' :
                'Payment Method Not Specified'
              }
            </p>
          </div>
          
          <div style="flex: 1; min-width: 250px; background: rgb(55, 65, 81); padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <div style="space-y: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: rgba(255, 255, 255, 0.8); font-size: 13px;">
                <span>Subtotal:</span>
                <span>${formatCurrency(calculateSubtotal(order))}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: rgba(255, 255, 255, 0.8); font-size: 13px;">
                <span>Shipping:</span>
                <span>R150.00</span>
              </div>
              <hr style="border: none; border-top: 2px solid rgba(244, 63, 94, 0.3); margin: 12px 0;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; color: white;">
                <span>Total:</span>
                <span style="color: rgb(244, 63, 94);">${formatCurrency(order.amount)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sticky Footer -->
        <div style="margin-top: auto; text-align: center; border-top: 1px solid rgba(244, 63, 94, 0.3); padding-top: 15px; flex-shrink: 0;">
          <p style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px; font-size: 13px; font-weight: 500;">
            Thank you for shopping with Rosemama! We appreciate your business.
          </p>
          <p style="font-size: 11px; color: rgba(255, 255, 255, 0.6);">
            For any inquiries, please contact us at info@rosemama.store or call +27 73 551 4705
          </p>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>INV-${order.order_id.slice(-8).toUpperCase()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            @media print {
              body { 
                margin: 0 !important; 
                background: rgb(40, 44, 52) !important; 
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print { display: none; }
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                margin: 0 !important;
                size: A4;
              }
            }
            body { 
              font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              background: rgb(40, 44, 52) !important;
              color: rgb(255, 255, 255) !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
              font-size: 14px;
              line-height: 1.5;
            }
            .invoice-container { 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 15px; 
            }
            /* Ensure all text is properly encoded and rendered */
            * {
              font-feature-settings: "kern" 1, "liga" 1;
              text-rendering: optimizeLegibility;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
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
 * Show invoice in a modal with beautiful dark theme styling
 */
export const viewInvoiceInModal = async (order: Order): Promise<void> => {
  const html = `
    <div style="max-width: 800px; margin: 0 auto; padding: 30px; background: rgb(40, 44, 52); color: rgb(255, 255, 255); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); display: flex; flex-direction: column; min-height: 70vh;">
      <!-- Modern Header with Gradient -->
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="background: linear-gradient(135deg, rgba(244, 63, 94, 1) 0%, rgba(219, 39, 119, 1) 100%); padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3); margin-bottom: 25px;">
          <h1 style="font-size: 48px; font-weight: bold; color: white; margin: 0 0 10px 0; letter-spacing: 2px;">ROSÉMAMA</h1>
          <p style="font-size: 22px; font-weight: 500; color: rgba(255, 255, 255, 0.9); margin: 0;">Premium Fashion & Lifestyle</p>
          <div style="width: 80px; height: 4px; background: white; margin: 15px auto 0; border-radius: 2px;"></div>
        </div>
        
        <!-- Contact Information with Icons -->
        <div style="display: flex; justify-content: center; align-items: center; gap: 30px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
            <span style="margin-right: 8px; font-weight: bold;">&bull;</span>
            <span>New Rd, Carlswald, Midrand, 1684</span>
          </div>
          <div style="display: flex; align-items: center; color: rgba(244, 63, 94, 1); font-size: 14px;">
            <span style="margin-right: 8px; font-weight: bold;">Tel:</span>
            <span>+27 73 551 4705</span>
          </div>
          <div style="display: flex; align-items: center; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
            <span style="margin-right: 8px; font-weight: bold;">@</span>
            <span>info@rosemama.store</span>
          </div>
        </div>
      </div>

        <!-- Invoice Details Cards -->
        <div style="display: flex; gap: 20px; margin-bottom: 25px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px; background: rgb(55, 65, 81); padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; color: rgb(244, 63, 94); text-align: left;">Invoice Details</h2>
            <div style="space-y: 8px; text-align: left;">
              <p style="margin: 4px 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;"><strong style="color: white;">Invoice Number:</strong> INV-${order.order_id.slice(-8).toUpperCase()}</p>
              <p style="margin: 4px 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;"><strong style="color: white;">Order ID:</strong> ${order.order_id}</p>
              <p style="margin: 4px 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;"><strong style="color: white;">Invoice Date:</strong> ${new Date(order.order_date).toLocaleDateString()}</p>
              <p style="margin: 4px 0;"><strong style="color: white;">Status:</strong> 
                <span style="background: ${getStatusColorInline(order.status)}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${order.status.toUpperCase()}</span>
              </p>
            </div>
          </div>
          
          <div style="flex: 1; min-width: 250px; background: rgb(55, 65, 81); padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; color: rgb(244, 63, 94); text-align: right;">Bill To</h2>
            <div style="space-y: 6px; text-align: right;">
              <p style="margin: 4px 0; font-weight: bold; color: white; font-size: 14px;">${order.customer_name}</p>
              <p style="margin: 4px 0; color: rgba(255, 255, 255, 0.8); font-size: 13px;">${order.customer_email}</p>
              ${order.shipping_address ? `
                <p style="margin: 4px 0; color: rgba(255, 255, 255, 0.8); font-size: 13px;">${order.shipping_address.address}</p>
                <p style="margin: 4px 0; color: rgba(255, 255, 255, 0.8); font-size: 13px;">${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}</p>
                <p style="margin: 4px 0; color: rgba(255, 255, 255, 0.8); font-size: 13px;">${order.shipping_address.country}</p>
                <p style="margin: 4px 0; color: rgba(244, 63, 94, 1); font-size: 13px;"><strong>Tel:</strong> ${order.shipping_address.phone}</p>
              ` : ''}
            </div>
          </div>
        </div>      <!-- Order Items Table -->
      <div style="background: rgb(55, 65, 81); border-radius: 12px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: linear-gradient(135deg, rgba(244, 63, 94, 1) 0%, rgba(219, 39, 119, 1) 100%);">
              <th style="padding: 16px 20px; text-align: left; color: white; font-weight: 600; font-size: 14px;">ITEM</th>
              <th style="padding: 16px 20px; text-align: right; color: white; font-weight: 600; font-size: 14px;">QTY</th>
              <th style="padding: 16px 20px; text-align: right; color: white; font-weight: 600; font-size: 14px;">PRICE</th>
              <th style="padding: 16px 20px; text-align: right; color: white; font-weight: 600; font-size: 14px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items && order.order_items.length > 0 ?
              order.order_items.map((item: any, index: number) => `
                <tr style="background: ${index % 2 === 0 ? 'rgb(55, 65, 81)' : 'rgb(45, 55, 72)'}; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                  <td style="padding: 16px 20px;">
                    <div>
                      <div style="font-weight: 600; color: white; font-size: 15px;">${item.products?.name || 'Unknown Product'}</div>
                      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-top: 4px;">${item.products?.category || 'N/A'}</div>
                    </div>
                  </td>
                  <td style="padding: 16px 20px; text-align: right; color: rgba(255, 255, 255, 0.9); font-weight: 500;">${item.quantity}</td>
                  <td style="padding: 16px 20px; text-align: right; color: rgba(255, 255, 255, 0.9);">${formatCurrency(item.price_at_purchase)}</td>
                  <td style="padding: 16px 20px; text-align: right; color: white; font-weight: 600;">${formatCurrency(item.quantity * item.price_at_purchase)}</td>
                </tr>
              `).join('') :
              '<tr><td colspan="4" style="padding: 20px; text-align: center; color: rgba(255, 255, 255, 0.6);">No items found in this order</td></tr>'
            }
          </tbody>
        </table>
      </div>

      <!-- Payment and Totals Section -->
      <div style="display: flex; gap: 30px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px; background: rgb(55, 65, 81); padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h3 style="font-size: 20px; font-weight: bold; margin: 0 0 15px 0; color: rgb(244, 63, 94);">Payment Method</h3>
          <p style="color: rgba(255, 255, 255, 0.8); font-size: 16px;">
            ${order.payment_method === 'cash-on-delivery' ? 'Cash on Delivery' :
              order.payment_method === 'bank-transfer' ? 'Bank Transfer' :
              order.payment_method === 'credit-card' ? 'Credit Card' :
              'Payment Method Not Specified'
            }
          </p>
        </div>
        
        <div style="flex: 1; min-width: 250px; background: rgb(55, 65, 81); padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="space-y: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; color: rgba(255, 255, 255, 0.8);">
              <span>Subtotal:</span>
              <span>${formatCurrency(calculateSubtotal(order))}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; color: rgba(255, 255, 255, 0.8);">
              <span>Shipping:</span>
              <span>R150.00</span>
            </div>
            <hr style="border: none; border-top: 2px solid rgba(244, 63, 94, 0.3); margin: 16px 0;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 20px; color: white;">
              <span>Total:</span>
              <span style="color: rgb(244, 63, 94);">${formatCurrency(order.amount)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Elegant Footer -->
      <div style="margin-top: auto; text-align: center; border-top: 2px solid rgba(244, 63, 94, 0.3); padding-top: 30px;">
        <p style="color: rgba(255, 255, 255, 0.9); margin-bottom: 12px; font-size: 16px; font-weight: 500;">
          Thank you for shopping with Rosemama! We appreciate your business.
        </p>
        <p style="font-size: 14px; color: rgba(255, 255, 255, 0.6);">
          For any inquiries, please contact us at info@rosemama.store or call +27 73 551 4705
        </p>
      </div>
    </div>
  `;
  const modal = document.createElement('div');
  modal.id = 'invoice-modal-overlay';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  modal.style.zIndex = '9999';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';

  // Add click outside to close functionality
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = 'rgb(40, 44, 52)';
  modalContent.style.maxWidth = '90vw';
  modalContent.style.maxHeight = '90vh';
  modalContent.style.overflow = 'auto';
  modalContent.style.borderRadius = '16px';
  modalContent.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)';
  
  // Create close function that properly removes the modal
  const closeModal = () => {
    const modalElement = document.getElementById('invoice-modal-overlay');
    if (modalElement && modalElement.parentNode) {
      modalElement.parentNode.removeChild(modalElement);
    }
  };

  modalContent.innerHTML = `
    <div style="padding: 20px; background: rgb(40, 44, 52); display: flex; flex-direction: column; min-height: 80vh;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 24px; font-weight: bold; color: white; margin: 0;">Invoice Preview</h2>
        <button id="close-modal-btn" style="background: linear-gradient(135deg, rgb(244, 63, 94), rgb(219, 39, 119)); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">Close</button>
      </div>
      <div style="flex: 1;">
        ${html}
      </div>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Add proper event listener for close button after modal is added to DOM
  setTimeout(() => {
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
  }, 0);
};
