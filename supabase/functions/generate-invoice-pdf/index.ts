/// <reference path="./types.d.ts" />

// @ts-ignore: Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno imports
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const orderData: OrderData = await req.json();

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Generate HTML with advanced styling
    const htmlContent = generateInvoiceHTML(orderData);

    // Set HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Configure PDF options for high quality
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      // Custom page ranges if needed
      pageRanges: '1'
    });

    await browser.close();

    // Return PDF as response
    return new Response(pdfBuffer as BodyInit, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${orderData.order_id.slice(-8).toUpperCase()}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF', details: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

function generateInvoiceHTML(order: OrderData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${order.order_id}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
          height: 4px;
          background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%);
        }

        .header-section {
          text-align: center;
          margin-bottom: 50px;
          position: relative;
        }

        .brand-header {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          padding: 30px 40px;
          border-radius: 16px;
          margin-bottom: 30px;
          box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.3);
        }

        .brand-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 52px;
          font-weight: 700;
          color: white;
          letter-spacing: -1px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 8px;
        }

        .brand-tagline {
          font-size: 20px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 1px;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid #f3f4f6;
        }

        .contact-icon {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          color: #6b7280;
        }

        .contact-text {
          font-weight: 500;
          color: #374151;
        }

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
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #f3f4f6;
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
        }

        .status-pending { background: #fef3c7; color: #d97706; }
        .status-processing { background: #dbeafe; color: #2563eb; }
        .status-shipped { background: #dbeafe; color: #7c3aed; }
        .status-delivered { background: #d1fae5; color: #065f46; }

        .orders-section {
          margin-bottom: 40px;
        }

        .orders-header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 20px 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2);
        }

        .orders-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .orders-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
          padding: 16px 20px;
          background: #f8fafc;
          border-radius: 12px;
          font-weight: 600;
          color: #374151;
          border: 1px solid #e5e7eb;
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
          transition: all 0.2s ease;
          margin-bottom: 8px;
        }

        .order-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .item-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .item-category {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quantity-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #dbeafe;
          color: #2563eb;
          border-radius: 50%;
          font-weight: 600;
          font-size: 14px;
        }

        .price-text {
          font-weight: 500;
          color: #374151;
        }

        .total-text {
          font-weight: 700;
          color: #059669;
        }

        .summary-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .payment-card, .total-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #f3f4f6;
        }

        .payment-header {
          background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin: -16px -16px 20px -16px;
        }

        .total-header {
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin: -16px -16px 20px -16px;
        }

        .payment-icon {
          width: 24px;
          height: 24px;
          margin-bottom: 12px;
          color: #f97316;
        }

        .payment-method-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .payment-method-desc {
          font-size: 14px;
          color: #6b7280;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-label {
          font-weight: 500;
          color: #6b7280;
        }

        .summary-value {
          font-weight: 600;
          color: #1f2937;
        }

        .total-row {
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf9 100%);
          padding: 16px;
          border-radius: 12px;
          margin-top: 16px;
        }

        .total-label {
          font-size: 18px;
          font-weight: 700;
          color: #065f46;
        }

        .total-value {
          font-size: 24px;
          font-weight: 800;
          color: #047857;
        }

        .footer-section {
          text-align: center;
          padding: 32px 0;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          margin: 0 -40px -40px -40px;
          border-radius: 0 0 16px 16px;
        }

        .footer-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .footer-heart {
          width: 32px;
          height: 32px;
          color: #ec4899;
          margin-bottom: 16px;
          display: inline-block;
        }

        .footer-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 12px;
        }

        .footer-message {
          font-size: 16px;
          color: #4b5563;
          margin-bottom: 16px;
          line-height: 1.6;
        }

        .footer-contact {
          font-size: 14px;
          color: #6b7280;
        }

        .contact-link {
          color: #3b82f6;
          font-weight: 600;
          text-decoration: none;
        }

        .contact-link:hover {
          text-decoration: underline;
        }

        .footer-timestamp {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #d1d5db;
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="contact-text">New Rd, Carlswald, Midrand, 1684</span>
            </div>
            <div class="contact-item">
              <svg class="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span class="contact-text">+27 63 470 8046</span>
            </div>
            <div class="contact-item">
              <svg class="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span class="contact-text">info@rosemama.store</span>
            </div>
          </div>
        </div>

        <!-- Invoice Details Section -->
        <div class="section-grid">
          <!-- Invoice Details Card -->
          <div class="info-card">
            <div class="card-header">
              <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
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

          <!-- Customer Details Card -->
          <div class="info-card">
            <div class="card-header">
              <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <h3 class="card-title">Bill To</h3>
            </div>
            <div style="padding: 20px;">
              <h4 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">${order.customer_name}</h4>
              <p style="color: #6b7280; margin-bottom: 16px;">${order.customer_email}</p>

              ${order.shipping_address ? `
                <div style="display: flex; align-items: center; margin-bottom: 8px; color: #374151;">
                  <svg style="width: 16px; height: 16px; margin-right: 8px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  ${order.shipping_address.address}
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px; color: #374151;">
                  <svg style="width: 16px; height: 16px; margin-right: 8px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px; color: #374151;">
                  <svg style="width: 16px; height: 16px; margin-right: 8px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"/>
                  </svg>
                  ${order.shipping_address.country}
                </div>
                <div style="display: flex; align-items: center; color: #059669;">
                  <svg style="width: 16px; height: 16px; margin-right: 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  ${order.shipping_address.phone}
                </div>
              ` : '<p style="color: #9ca3af; font-style: italic;">Address not available</p>'}
            </div>
          </div>
        </div>

        <!-- Orders Section -->
        <div class="orders-section">
          <div class="orders-header">
            <h3 class="orders-title">Order Items</h3>
          </div>

          ${order.order_items && order.order_items.length > 0 ? `
            <div class="orders-grid">
              <div>Item Description</div>
              <div style="text-align: center;">Qty</div>
              <div style="text-align: right;">Price</div>
              <div style="text-align: right;">Total</div>
            </div>

            ${order.order_items.map(item => `
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
            `).join('')}
          ` : '<div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px; color: #6b7280;">No items found in this order</div>'}
        </div>

        <!-- Summary Section -->
        <div class="summary-section">
          <div class="payment-card">
            <div class="payment-header">
              <h4 style="font-size: 16px; font-weight: 600; margin: 0;">Payment Method</h4>
            </div>
            <div style="padding: 20px;">
              ${order.payment_method === 'cash-on-delivery' ? `
                <div style="text-align: center;">
                  <svg class="payment-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2-2z"/>
                  </svg>
                  <div class="payment-method-name">Cash on Delivery</div>
                  <div class="payment-method-desc">Pay when you receive your order</div>
                </div>
              ` : order.payment_method === 'bank-transfer' ? `
                <div style="text-align: center;">
                  <svg class="payment-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  <div class="payment-method-name">Bank Transfer</div>
                  <div class="payment-method-desc">Direct bank transfer payment</div>
                </div>
              ` : order.payment_method === 'credit-card' ? `
                <div style="text-align: center;">
                  <svg class="payment-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  <div class="payment-method-name">Credit Card</div>
                  <div class="payment-method-desc">Secure credit card payment</div>
                </div>
              ` : `
                <div style="text-align: center;">
                  <svg class="payment-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div class="payment-method-name">Payment Method Not Specified</div>
                  <div class="payment-method-desc">Payment method will be confirmed</div>
                </div>
              `}
            </div>
          </div>

          <div class="total-card">
            <div class="total-header">
              <h4 style="font-size: 16px; font-weight: 600; margin: 0;">Order Summary</h4>
            </div>
            <div style="padding: 20px;">
              <div class="summary-row">
                <span class="summary-label">Subtotal</span>
                <span class="summary-value">R$${calculateSubtotal(order).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Shipping</span>
                <span class="summary-value">R150.00</span>
              </div>
              <div class="total-row">
                <span class="total-label">Total Amount</span>
                <span class="total-value">R${order.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Section -->
        <div class="footer-section">
          <div class="footer-content">
            <svg class="footer-heart" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
            </svg>
            <h4 class="footer-title">Thank You for Your Business!</h4>
            <p class="footer-message">
              We hope you love your new Rosemama fashion pieces! Your support helps us bring you the best in premium fashion.
            </p>
            <p class="footer-contact">
              Questions? Contact us at <span class="contact-link">info@rosemama.store</span> or call <span class="contact-link">+27 63 470 8046</span>
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

function calculateSubtotal(order: OrderData): number {
  if (!order.order_items) return order.amount;
  return order.order_items.reduce((total: number, item: any) =>
    total + (item.quantity * item.price_at_purchase), 0
  );
}
