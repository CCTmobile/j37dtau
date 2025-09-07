import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDFFromElement = async (
  elementId: string,
  filename: string = 'invoice.pdf'
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Configure html2canvas options for better quality
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const printElement = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found');
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }

  // Get all stylesheets
  const stylesheets = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        // Handle cross-origin stylesheets
        return '';
      }
    })
    .join('\n');

  // Create the print document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Invoice</title>
        <style>
          ${stylesheets}
          
          @media print {
            body {
              margin: 0;
              padding: 20px;
              background: white !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            button {
              display: none !important;
            }
            
            .bg-gradient-to-r,
            .bg-gradient-to-br {
              background: linear-gradient(135deg, #ec4899, #8b5cf6) !important;
              color: white !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .shadow-lg,
            .shadow-2xl,
            .shadow-xl {
              box-shadow: none !important;
            }
            
            .border {
              border: 1px solid #e5e7eb !important;
            }
            
            .rounded-2xl,
            .rounded-xl,
            .rounded-lg {
              border-radius: 8px !important;
            }
            
            .backdrop-blur-sm {
              backdrop-filter: none !important;
            }
          }
          
          @page {
            margin: 0.5in;
            size: A4;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 500);
};

// Enhanced PDF generation with custom styling for print
export const generateStyledPDF = async (
  elementId: string,
  filename: string = 'rosemama-invoice.pdf',
  options?: {
    title?: string;
    customerName?: string;
    orderNumber?: string;
  }
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.backgroundColor = 'white';
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // Apply print styles
    const printStyles = `
      .no-print, button { display: none !important; }
      .bg-gradient-to-r, .bg-gradient-to-br {
        background: linear-gradient(135deg, #ec4899, #8b5cf6) !important;
        color: white !important;
      }
      .shadow-lg, .shadow-2xl, .shadow-xl { box-shadow: none !important; }
      .border { border: 1px solid #e5e7eb !important; }
      .backdrop-blur-sm { backdrop-filter: none !important; }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    tempContainer.appendChild(styleElement);

    // Generate canvas
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    const imgData = canvas.toDataURL('image/png');
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add metadata
    pdf.setProperties({
      title: options?.title || 'Rosémama Invoice',
      subject: `Invoice for ${options?.customerName || 'Customer'}`,
      author: 'Rosémama Fashion',
      keywords: 'invoice, fashion, rosemama',
      creator: 'Rosémama E-commerce System'
    });

    let position = 0;
    let heightLeft = imgHeight;
    const pageHeight = 295;

    // Add pages
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save with custom filename
    const finalFilename = options?.orderNumber 
      ? `rosemama-invoice-${options.orderNumber}.pdf`
      : filename;
      
    pdf.save(finalFilename);
  } catch (error) {
    console.error('Error generating styled PDF:', error);
    throw error;
  }
};
