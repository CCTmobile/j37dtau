import html2canvas from 'html2canvas';
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
 * Enhanced PDF generation with modern CSS support & Puppeteer-style quality
 */
export const generateModernPDF = async (order: OrderData): Promise<void> => {
  try {
    // Create a new HTML document for better rendering
    const newWindow = window.open('', '_blank', 'width=1,height=1');
    if (!newWindow) {
      throw new Error('Please allow popups to generate PDF');
    }

    // Generate enhanced HTML with modern styling
    const htmlContent = generateModernHTML(order);

    // Write content to the new window
    newWindow.document.write(htmlContent);
    newWindow.document.close();

    // Wait for content to load and render
    await new Promise((resolve) => {
      const checkLoaded = () => {
        if (newWindow.document.readyState === 'complete') {
          resolve(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });

    // Wait for fonts to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Use html2canvas with enhanced settings
    const html2canvasOptions = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f8fafc',
      width: newWindow.document.body.scrollWidth,
      height: newWindow.document.body.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: newWindow.innerWidth,
      windowHeight: newWindow.innerHeight,
      logging: false,
      removeContainer: true,
      ignoreElements: (element: Element) => {
        return element.classList?.contains('no-pdf') ||
               element.tagName === 'SCRIPT' ||
               element.id === 'no-pdf';
      }
    };

    const canvas = await html2canvas(newWindow.document.body as HTMLElement, html2canvasOptions);

    // Create PDF with high quality settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Handle multi-page content
    let heightLeft = imgHeight;
    let position = 0;
    let currentPage = 1;

    // Add first page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);

    // Add additional pages if needed
    heightLeft -= pdfHeight;
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      currentPage++;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Close the window
    newWindow.close();

    // Download the PDF
    const invoiceNumber = `INV-${order.order_id.slice(-8).toUpperCase()}`;
    pdf.save(`${invoiceNumber}.pdf`);

  } catch (error) {
    console.error('Modern PDF generation error:', error);
    throw new Error(`Failed to generate modern PDF invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate modern HTML with advanced CSS for high-quality PDF output
 */
function generateModernHTML(order: OrderData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rosemama Invoice - ${order.order_id}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }

        body {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          color: #1f2937;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }

        .invoice-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 30%, #f59e0b 70%, #10b981 100%);
          border-radius: 16px 16px 0 0;
        }

        /* Header Section */
        .header-section {
          text-align: center;
          margin-bottom: 50px;
          position: relative;
        }

        .brand-header {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          padding: 35px 45px;
          border-radius: 16px;
          margin-bottom: 30px;
          box-shadow: 0 12px 20px -5px rgba(139, 92, 246, 0.4);
          position: relative;
        }

        .brand-header::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #ec4899 0%, #f59e0b 50%, #10b981 100%);
          border-radius: 16px;
          z-index: -1;
          opacity: 0.3;
        }

        .brand-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 48px;
          font-weight: 700;
          color: white;
          letter-spacing: -1px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          margin-bottom: 10px;
        }

        .brand-tagline {
          font-size: 18px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: 1px;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-top: 30px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .contact-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }

        .contact-icon {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          color: #6b7280;
          flex-shrink: 0;
        }

        .contact-text {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        /* Content Sections */
        .section-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 40px;
        }

        .info-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
          position: relative;
          overflow: hidden;
        }

        .info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
        }

        .card-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f3f4f6;
        }

        .card-icon {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          color: #8b5cf6;
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f9fafb;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-weight: 500;
          color: #6b7280;
          font-size: 14px;
        }

        .info-value {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .status-pending { background: #fef3c7; color: #d97706; border: 1px solid #f59e0b; }
        .status-processing { background: #dbeafe; color: #2563eb; border: 1px solid #3b82f6; }
        .status-shipped { background: #dbeafe; color: #7c3aed; border: 1px solid #8b5cf6; }
        .status-delivered { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }

        /* Orders Section */
        .orders-section {
          margin-bottom: 40px;
        }

        .orders-header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
          color: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.3);
          text-align: center;
        }

        .orders-title {
          font-size: 22px;
          font-weight: 600;
          margin: 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .orders-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          font-weight: 600;
          color: #374151;
          border: 1px solid #e5e7eb;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .order-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          align-items: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .order-item:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .item-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
          font-size: 15px;
        }

        .item-category {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 500;
        }

        .quantity-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1d4ed8;
          border-radius: 50%;
          font-weight: 700;
          font-size: 16px;
          box-shadow: 0 2px 4px rgba(29, 78, 216, 0.2);
        }

        .price-text {
          font-weight: 600;
          color: #374151;
          font-size: 15px;
        }

        .total-text {
          font-weight: 800;
          color: #059669;
          font-size: 15px;
          text-shadow: 0 1px 2px rgba(5, 150, 105, 0.2);
        }

        /* Summary Section */
        .summary-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .payment-card, .total-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
          position: relative;
          overflow: hidden;
        }

        .payment-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
        }

        .total-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .payment-header {
          color: #dc2626;
          padding: 8px 0;
          margin-bottom: 20px;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
        }

        .total-header {
          color: #059669;
          padding: 8px 0;
          margin-bottom: 20px;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
        }

        .header-icon {
          width: 20px;
          height: 20px;
          margin-right: 8px;
        }

        .payment-icon-container {
          text-align: center;
          margin-bottom: 16px;
        }

        .payment-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .payment-method-name {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 6px;
        }

        .payment-method-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s ease;
        }

        .summary-row:hover {
          background-color: #f9fafb;
        }

        .summary-row:last-child {
          border-bottom: none;
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf9 100%);
          padding: 16px;
          border-radius: 12px;
          margin: 16px -8px -8px -8px;
          border: 1px solid #a7f3d0;
        }

        .summary-label {
          font-weight: 500;
          color: #6b7280;
          font-size: 15px;
        }

        .summary-value {
          font-weight: 600;
          color: #1f2937;
          font-size: 15px;
        }

        .total-label {
          font-size: 16px;
          font-weight: 700;
          color: #065f46;
        }

        .total-value {
          font-size: 20px;
          font-weight: 800;
          color: #047857;
        }

        /* Footer Section */
        .footer-section {
          margin-top: 40px;
          padding: 40px;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 0 0 16px 16px;
          text-align: center;
          position: relative;
        }

        .footer-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 20px;
          right: 20px;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #9ca3af 50%, transparent 100%);
        }

        .footer-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .footer-heart {
          width: 40px;
          height: 40px;
          color: #ec4899;
          margin-bottom: 20px;
          display: inline-block;
          filter: drop-shadow(0 2px 4px rgba(236, 72, 153, 0.3));
        }

        .footer-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .footer-message {
          font-size: 16px;
          color: #4b5563;
          margin-bottom: 20px;
          line-height: 1.6;
          font-weight: 500;
        }

        .footer-contact {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 16px;
          font-weight: 500;
        }

        .contact-link {
          color: #3b82f6;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .contact-link:hover {
          color: #1d4ed8;
        }

        .footer-timestamp {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #d1d5db;
          font-weight: 500;
        }

        /* Print optimizations */
        @media print {
          .invoice-container {
            box-shadow: none;
            margin: 0;
            padding: 20px;
          }

          .invoice-container::before {
            display: none;
          }

          .footer-section {
            background: white;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="brand-header">
            <h1 class="brand-name">ROSÉMAMA</h1>
            <p class="brand-tagline">Premium Fashion & Lifestyle</p>
          </div>

          <div class="contact-grid">
            <div class="contact-item">
              <svg class="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span class="contact-text">New Rd, Carlswald, Midrand, 1684</span>
            </div>
            <div class="contact-item">
              <svg class="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <span class="contact-text">+27 73 551 4705</span>
            </div>
            <div class="contact-item">
              <svg class="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span class="contact-text">info@rosemama.store</span>
            </div>
          </div>
        </div>

        <!-- Invoice Details Section -->
        <div class="section-grid">
          <div class="info-card">
            <div class="card-header">
              <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 class="card-title">Invoice Details</h3>
            </div>
            <div class="info-row">
              <span class="info-label">Invoice Number</span>
              <span class="info-value">INV-${order.order_id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Order ID</span>
              <span class="info-value">${order.order_id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Invoice Date</span>
              <span class="info-value">${new Date(order.order_date).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="status-badge status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </div>
          </div>

          <div class="info-card">
            <div class="card-header">
              <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <h3 class="card-title">Bill To</h3>
            </div>
            <div style="padding: 20px;">
              <h4 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">${order.customer_name}</h4>
              <p style="color: #6b7280; margin-bottom: 16px;">${order.customer_email}</p>

              ${order.shipping_address ? `
                <p style="display: flex; align-items: center; margin-bottom: 8px; color: #374151;">
                  <svg style="width: 16px; height: 16px; margin-right: 8px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  ${order.shipping_address.address}
                </p>
                <p style="display: flex; align-items: center; margin-bottom: 8px; color: #374151;">
                  <svg style="width: 16px; height: 16px; margin-right: 8px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}
                </p>
                <p style="display: flex; align-items: center; margin-bottom: 8px; color: #374151;">
                  <svg style="width: 16px; height: 16px; margin-right: 8px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                  </svg>
                  ${order.shipping_address.country}
                </p>
                <p style="display: flex; align-items: center; color: #059669;">
                  <svg style="width: 16px; height: 16px; margin-right: 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  ${order.shipping_address.phone}
                </p>
              ` : '<p style="color: #9ca3af; font-style: italic;">Address not available</p>'}
            </div>
          </div>
        </div>

        <!-- Orders Section -->
        <div class="orders-section">
          <div class="orders-header">
            <h3 class="orders-title">Order Items</h3>
          </div>

          <div class="orders-grid">
            <div>Item Description</div>
            <div style="text-align: center;">Qty</div>
            <div style="text-align: right;">Price</div>
            <div style="text-align: right;">Total</div>
          </div>

          ${order.order_items && order.order_items.length > 0 ?
            order.order_items.map(item => `
              <div class="order-item">
                <div>
                  <div class="item-name">${item.products?.name || 'Unknown Product'}</div>
                  <div class="item-category">${item.products?.category || 'N/A'}</div>
                </div>
                <div style="text-align: center;">
                  <div class="quantity-badge">${item.quantity}</div>
                </div>
                <div style="text-align: right;">
                  <span class="price-text">R${item.price_at_purchase.toFixed(2)}</span>
                </div>
                <div style="text-align: right;">
                  <span class="total-text">R${(item.quantity * item.price_at_purchase).toFixed(2)}</span>
                </div>
              </div>
            `).join('') :
            '<div class="order-item" style="grid-template-columns: 1fr; text-align: center; color: #6b7280;"><span>No items found in this order</span></div>'
          }
        </div>

        <!-- Summary Section -->
        <div class="summary-section">
          <div class="payment-card">
            <div class="payment-header">
              <svg class="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2-2z"></path>
              </svg>
              Payment Method
            </div>
            <div class="payment-icon-container">
              <div class="payment-icon">
                ${order.payment_method === 'cash-on-delivery' ? '💰' :
                  order.payment_method === 'bank-transfer' ? '🏦' :
                  order.payment_method === 'credit-card' ? '💳' : '❓'
                }
              </div>
              <div class="payment-method-name">${order.payment_method === 'cash-on-delivery' ? 'Cash on Delivery' :
                order.payment_method === 'bank-transfer' ? 'Bank Transfer' :
                order.payment_method === 'credit-card' ? 'Credit Card' :
                'Payment Method Not Specified'}</div>
              <div class="payment-method-desc">${order.payment_method === 'cash-on-delivery' ? 'Pay when you receive your order' :
                order.payment_method === 'bank-transfer' ? 'Direct bank transfer payment' :
                order.payment_method === 'credit-card' ? 'Secure credit card payment' :
                'Payment method will be confirmed'}</div>
            </div>
          </div>

          <div class="total-card">
            <div class="total-header">
              <svg class="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
              </svg>
              Order Summary
            </div>
            <div class="summary-row">
              <span class="summary-label">Subtotal</span>
              <span class="summary-value">R$${calculateSubtotal(order).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Shipping</span>
              <span class="summary-value">R150.00</span>
            </div>
            <div class="summary-row">
              <span class="total-label">Total Amount</span>
              <span class="total-value">R${order.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Footer Section -->
        <div class="footer-section">
          <div class="footer-content">
            <svg class="footer-heart" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
            </svg>
            <h4 class="footer-title">Thank You for Your Business!</h4>
            <p class="footer-message">
              We hope you love your new Rosemama fashion pieces! Your support helps us bring you the best in premium fashion.
            </p>
            <p class="footer-contact">
              Questions? Contact us at <span class="contact-link">info@rosemama.store</span> or call <span class="contact-link">+27 73 551 4705</span>
            </p>
            <p class="footer-timestamp">
              Invoice generated on ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Helper function to calculate subtotal
 */
function calculateSubtotal(order: OrderData): number {
  if (!order.order_items) return order.amount;
  return order.order_items.reduce((total: number, item: any) =>
    total + (item.quantity * item.price_at_purchase), 0
  );
}

/**
 * Print the invoice (unchanged)
 */
export const printInvoice = async (order: OrderData): Promise<void> => {
  // Use existing implementation
  const { printInvoice: originalPrint } = await import('./pdfUtils');
  return originalPrint(order);
};

/**
 * View invoice in modal (unchanged)
 */
export const viewInvoiceInModal = async (order: OrderData): Promise<void> => {
  // Use existing implementation
  const { viewInvoiceInModal: originalView } = await import('./pdfUtils');
  return originalView(order);
};
