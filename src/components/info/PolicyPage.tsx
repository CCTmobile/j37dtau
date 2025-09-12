import React from 'react';
import { FileText, Shield, Truck, RotateCcw, HelpCircle, Phone } from 'lucide-react';

interface PolicyPageProps {
  type: 'privacy' | 'terms' | 'shipping' | 'returns' | 'help' | 'contact';
}

const policyContent = {
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'September 12, 2025',
    icon: Shield,
    sections: [
      {
        title: 'Introduction and POPIA Compliance',
        content: `
          <p>Rosémama Clothing is committed to protecting your privacy and personal information in accordance with the Protection of Personal Information Act (POPIA), Act 4 of 2013, and other applicable South African privacy laws.</p>
          
          <p><strong>Responsible Party:</strong><br>
          Rosémama Clothing<br>
          New Road, Midrand, South Africa<br>
          Email: hello@rosemamaclothing.store<br>
          Phone: +27 735 514 705</p>
          
          <p>This policy explains how we collect, use, store, and protect your personal information when you visit our website or use our services.</p>
        `
      },
      {
        title: 'Information We Collect',
        content: `
          <p>We collect personal information necessary to provide our services. This includes information you provide directly and information collected automatically.</p>
          
          <h4>Personal Information includes:</h4>
          <ul>
            <li><strong>Identity Information:</strong> Name, surname, ID number (when required)</li>
            <li><strong>Contact Information:</strong> Email address, phone number, postal address</li>
            <li><strong>Financial Information:</strong> Payment details, billing address</li>
            <li><strong>Account Information:</strong> Username, password, purchase history</li>
            <li><strong>Communication Records:</strong> Customer service interactions, feedback</li>
            <li><strong>Technical Information:</strong> IP address, browser type, device information</li>
          </ul>
          
          <h4>Lawful Basis for Processing:</h4>
          <p>We process your personal information based on:</p>
          <ul>
            <li>Contractual necessity (to fulfill orders and provide services)</li>
            <li>Legal compliance (tax records, fraud prevention)</li>
            <li>Legitimate interests (improving services, security)</li>
            <li>Consent (marketing communications, optional features)</li>
          </ul>
        `
      },
      {
        title: 'How We Use Your Information',
        content: `
          <p>We use your personal information for specific, legitimate purposes:</p>
          
          <h4>Primary Purposes:</h4>
          <ul>
            <li>Processing and fulfilling your orders</li>
            <li>Providing customer service and support</li>
            <li>Managing your account and maintaining records</li>
            <li>Processing payments and preventing fraud</li>
            <li>Compliance with legal obligations (tax, audit requirements)</li>
          </ul>
          
          <h4>Secondary Purposes (with consent):</h4>
          <ul>
            <li>Sending marketing communications and promotional offers</li>
            <li>Personalizing your shopping experience</li>
            <li>Market research and improving our services</li>
            <li>Product recommendations based on purchase history</li>
          </ul>
          
          <p><strong>Marketing Consent:</strong> You can opt-out of marketing communications at any time by clicking unsubscribe in emails or contacting us directly.</p>
        `
      },
      {
        title: 'Information Sharing and Third Parties',
        content: `
          <p>We do not sell your personal information. We share information only when necessary and with appropriate safeguards:</p>
          
          <h4>Authorized Sharing:</h4>
          <ul>
            <li><strong>Courier Partners:</strong> PAXI and PostNet (name, address, phone for delivery)</li>
            <li><strong>Payment Processors:</strong> Secure payment gateways for transaction processing</li>
            <li><strong>Technology Providers:</strong> Web hosting, email services (with data processing agreements)</li>
            <li><strong>Legal Requirements:</strong> When required by South African law or court orders</li>
          </ul>
          
          <h4>International Transfers:</h4>
          <p>Some service providers may process data outside South Africa. We ensure adequate protection through:</p>
          <ul>
            <li>Contractual safeguards and data processing agreements</li>
            <li>Verification of adequate data protection laws</li>
            <li>Regular monitoring of international data transfers</li>
          </ul>
        `
      },
      {
        title: 'Your Rights Under POPIA',
        content: `
          <p>You have the following rights regarding your personal information:</p>
          
          <h4>Access and Transparency:</h4>
          <ul>
            <li>Right to know what personal information we hold about you</li>
            <li>Right to access your personal information</li>
            <li>Right to information about how we process your data</li>
          </ul>
          
          <h4>Control and Correction:</h4>
          <ul>
            <li>Right to correct or update inaccurate information</li>
            <li>Right to delete your personal information (subject to legal requirements)</li>
            <li>Right to restrict processing in certain circumstances</li>
            <li>Right to object to processing for direct marketing</li>
            <li>Right to data portability</li>
          </ul>
          
          <h4>Exercising Your Rights:</h4>
          <p>To exercise these rights, contact us at:</p>
          <ul>
            <li>Email: hello@rosemamaclothing.store</li>
            <li>Phone: +27 735 514 705</li>
            <li>Post: New Road, Midrand, South Africa</li>
          </ul>
          <p>We will respond within 2 days as required by POPIA.</p>
        `
      },
      {
        title: 'Data Security and Retention',
        content: `
          <h4>Security Measures:</h4>
          <p>We implement appropriate technical and organizational measures to protect your personal information:</p>
          <ul>
            <li>SSL encryption for all data transmission</li>
            <li>Secure, PCI-compliant payment processing</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and staff training</li>
            <li>Regular backups and disaster recovery procedures</li>
          </ul>
          
          <h4>Data Retention:</h4>
          <p>We retain personal information only as long as necessary:</p>
          <ul>
            <li><strong>Transaction Records:</strong> 5 years (tax compliance requirements)</li>
            <li><strong>Marketing Data:</strong> Until you opt-out or 3 years of inactivity</li>
            <li><strong>Account Information:</strong> Until account deletion requested</li>
            <li><strong>Legal Requirements:</strong> As mandated by South African law</li>
          </ul>
        `
      },
      {
        title: 'Cookies and Tracking',
        content: `
          <p>Our website uses cookies and similar technologies to enhance your experience:</p>
          
          <h4>Types of Cookies:</h4>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for website functionality</li>
            <li><strong>Performance Cookies:</strong> Help us understand how you use our site</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences</li>
            <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</li>
          </ul>
          
          <p>You can manage cookie preferences through your browser settings. Note that disabling essential cookies may affect website functionality.</p>
        `
      },
      {
        title: 'Contact and Complaints',
        content: `
          <h4>Privacy Inquiries:</h4>
          <p>For questions about this privacy policy or our data practices:</p>
          <ul>
            <li><strong>Email:</strong> hello@rosemamaclothing.store</li>
            <li><strong>Phone:</strong> +27 735 514 705</li>
            <li><strong>Address:</strong> New Road, Midrand, South Africa</li>
          </ul>
          
          <h4>Complaints:</h4>
          <p>If you believe we have not handled your personal information properly, you can:</p>
          <ol>
            <li>Contact us directly using the details above</li>
            <li>Lodge a complaint with the Information Regulator of South Africa</li>
            <li>Visit: www.justice.gov.za/inforeg</li>
            <li>Email: inforeg@justice.gov.za</li>
          </ol>
        `
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'September 12, 2025',
    icon: FileText,
    sections: [
      {
        title: 'Acceptance of Terms',
        content: `
          <p>By accessing and using the Rosémama Clothing website (www.rosemamaclothing.store), you accept and agree to be bound by the terms and provision of this agreement. These terms are governed by South African law and comply with the Consumer Protection Act 68 of 2008 and the Electronic Communications and Transactions Act 25 of 2002.</p>
          
          <p>Our business is registered in South Africa and operates from New Road, Midrand, South Africa. All transactions are conducted under South African law.</p>
        `
      },
      {
        title: 'Use of the Website',
        content: `
          <p>You may use our website for lawful purposes only. You agree not to use the site:</p>
          <ul>
            <li>In any way that violates any applicable South African or international law</li>
            <li>To transmit, or procure the sending of, any unauthorized advertising or promotional material</li>
            <li>To impersonate or attempt to impersonate the company, employees, or other users</li>
            <li>To engage in any conduct that restricts or inhibits anyone's use of the website</li>
            <li>To attempt to gain unauthorized access to our systems or other users' accounts</li>
          </ul>
        `
      },
      {
        title: 'Product Information and Pricing',
        content: `
          <p>We strive to provide accurate product descriptions and pricing. However, we do not warrant that product descriptions, colors, or other content is accurate, complete, reliable, current, or error-free.</p>
          
          <p>All prices are listed in South African Rand (ZAR) and include VAT where applicable. Prices are subject to change without notice.</p>
          
          <p>We reserve the right to correct any errors, inaccuracies, or omissions and to change or update information at any time without prior notice.</p>
        `
      },
      {
        title: 'Order Acceptance and Payment',
        content: `
          <p>All orders are subject to acceptance by Rosémama Clothing. We reserve the right to refuse any order for any reason, including suspected fraud or unavailability of products.</p>
          
          <p>Payment must be received before order processing begins. We accept major South African credit cards, debit cards, EFT, and other approved payment methods.</p>
          
          <p>After placing an order, you will receive an email confirmation. This confirms we have received your order but does not constitute acceptance until payment is processed and confirmed.</p>
        `
      },
      {
        title: 'Consumer Rights (South African Law)',
        content: `
          <p>Under the South African Consumer Protection Act, you have the right to:</p>
          <ul>
            <li>Cancel your order within 2 days of receipt (cooling-off period)</li>
            <li>Return defective items for repair, replacement, or refund</li>
            <li>Receive goods that match their description and are of reasonable quality</li>
            <li>Fair and responsible marketing practices</li>
            <li>Access to information about goods and services in plain language</li>
          </ul>
          
          <p>These rights are in addition to any warranty or guarantee provided by the manufacturer.</p>
        `
      },
      {
        title: 'Privacy and Data Protection',
        content: `
          <p>We are committed to protecting your privacy in accordance with the Protection of Personal Information Act (POPIA). We collect only necessary information to process your orders and improve our services.</p>
          
          <p>Your personal information will not be shared with third parties except as necessary to fulfill your orders (e.g., shipping partners) or as required by law.</p>
          
          <p>You have the right to access, correct, or delete your personal information. Contact us at hello@rosemamaclothing.store for data protection requests.</p>
        `
      },
      {
        title: 'Limitation of Liability',
        content: `
          <p>To the fullest extent permitted by South African law, Rosémama Clothing shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our website or products.</p>
          
          <p>Our total liability for any claim shall not exceed the amount you paid for the specific product or service that is the subject of the claim.</p>
          
          <p>Nothing in these terms excludes or limits liability that cannot be excluded or limited under South African law, including liability for death or personal injury caused by negligence.</p>
        `
      },
      {
        title: 'Dispute Resolution',
        content: `
          <p>Any disputes arising from these terms or your use of our website shall be governed by South African law and subject to the jurisdiction of the South African courts.</p>
          
          <p>Before initiating legal proceedings, we encourage you to contact our customer service team at +27 735 514 705 or hello@rosemamaclothing.store to resolve any issues.</p>
          
          <p>You may also lodge complaints with the National Consumer Commission if you believe your consumer rights have been violated.</p>
        `
      }
    ]
  },
  shipping: {
    title: 'Shipping Policy',
    lastUpdated: 'September 12, 2025',
    icon: Truck,
    sections: [
      {
        title: 'Shipping Methods',
        content: `
          <p>We offer reliable and affordable shipping throughout South Africa using trusted courier partners.</p>
          
          <h4>PAXI (PEP Stores) - Store to Store</h4>
          <ul>
            <li><strong>Standard Delivery (7-9 business days):</strong> R59.95</li>
            <li><strong>Express Delivery (3-5 business days):</strong> R109.95</li>
            <li>Collect from any PEP store nationwide</li>
            <li>Over 2,000 collection points across South Africa</li>
            <li>SMS notifications when parcel arrives</li>
          </ul>
          
          <h4>PostNet - Store to Store</h4>
          <ul>
            <li><strong>PostNet2PostNet (2-3 business days):</strong> R99.00 (up to 2kg)</li>
            <li><strong>Standard Rate:</strong> R109.00 (up to 5kg)</li>
            <li>Over 400 PostNet locations nationwide</li>
            <li>Secure and reliable service</li>
            <li>Track your parcel online</li>
          </ul>
          
          <h4>PostNet - Door to Door</h4>
          <ul>
            <li><strong>Main Centres:</strong> R125.00 (up to 2kg)</li>
            <li><strong>Regional Centres:</strong> R150.00 (up to 2kg)</li>
            <li>Direct delivery to your address</li>
            <li>Signature required on delivery</li>
            <li>3-5 business days delivery time</li>
          </ul>
          
          <p><em>All prices include VAT. Shipping costs are calculated at checkout based on your location and preferred delivery method.</em></p>
        `
      },
      {
        title: 'Processing Time',
        content: `
          <p>Orders are typically processed within 1-2 business days from our Midrand facility. During peak seasons (holidays, sales), processing may take up to 3-5 business days.</p>
          <p>Custom or personalized items may require additional processing time of 5-10 business days.</p>
          <p>You will receive a tracking reference via SMS and email once your order is dispatched with the courier.</p>
          
          <h4>Order Cut-off Times</h4>
          <ul>
            <li><strong>Monday to Friday:</strong> Orders placed before 2 PM are processed the same day</li>
            <li><strong>Weekend Orders:</strong> Processed on the next business day</li>
            <li><strong>Public Holidays:</strong> Orders are processed on the next working day</li>
          </ul>
        `
      },
      {
        title: 'Delivery Areas & Times',
        content: `
          <h4>Gauteng (Johannesburg, Pretoria, Midrand)</h4>
          <ul>
            <li>PAXI: 3-5 business days</li>
            <li>PostNet Store: 2-3 business days</li>
            <li>PostNet Door-to-Door: 2-4 business days</li>
          </ul>
          
          <h4>Major Cities (Cape Town, Durban, Port Elizabeth, Bloemfontein)</h4>
          <ul>
            <li>PAXI: 5-7 business days</li>
            <li>PostNet Store: 3-4 business days</li>
            <li>PostNet Door-to-Door: 4-6 business days</li>
          </ul>
          
          <h4>Regional Areas & Towns</h4>
          <ul>
            <li>PAXI: 7-9 business days</li>
            <li>PostNet Store: 4-7 business days</li>
            <li>PostNet Door-to-Door: 5-8 business days</li>
          </ul>
          
          <p><strong>Free Shipping:</strong> Enjoy free PAXI standard delivery on orders over R750 throughout South Africa!</p>
          
          <h4>Special Notes</h4>
          <ul>
            <li>Remote areas may require additional delivery time</li>
            <li>Islands and offshore locations may have limited delivery options</li>
            <li>Some courier services may not deliver to PO Box addresses</li>
          </ul>
        `
      }
    ]
  },
  returns: {
    title: 'Return & Exchange Policy',
    lastUpdated: 'September 12, 2025',
    icon: RotateCcw,
    sections: [
      {
        title: 'Return Window',
        content: `
          <p>We offer a generous 30-day return window from the date of delivery. Items must be in their original condition with tags attached.</p>
          <h4>Acceptable Returns:</h4>
          <ul>
            <li>Unworn items with original tags</li>
            <li>Items in original packaging</li>
            <li>Items purchased at full price or on sale</li>
            <li>Items returned within 2 days of delivery</li>
          </ul>
          <h4>Non-Returnable Items:</h4>
          <ul>
            <li>Underwear and intimate apparel</li>
            <li>Personalized or custom items</li>
            <li>Items damaged by normal wear</li>
            <li>Items without original tags</li>
            <li>Items returned after 2 days</li>
          </ul>
        `
      },
      {
        title: 'How to Return - South African Customers',
        content: `
          <h4>Option 1: PAXI (PEP Stores) Returns</h4>
          <ol>
            <li>Log into your account and navigate to "Order History"</li>
            <li>Select the order and click "Request Return"</li>
            <li>Print the prepaid PAXI return label</li>
            <li>Package items securely and attach the PAXI label</li>
            <li>Drop off at any PEP store nationwide (over 2,000 locations)</li>
            <li><strong>Cost:</strong> Free return shipping via PAXI</li>
          </ol>
          
          <h4>Option 2: PostNet Returns</h4>
          <ol>
            <li>Contact our customer service at +27 735 514 705</li>
            <li>We'll provide a PostNet return reference</li>
            <li>Package items securely</li>
            <li>Drop off at any PostNet store (over 400 locations)</li>
            <li><strong>Cost:</strong> Return shipping at customer's expense (R99-R109)</li>
          </ol>
          
          <p><strong>Processing Time:</strong> Returns typically take 5-10 business days to process once we receive your package at our Midrand facility.</p>
        `
      },
      {
        title: 'Exchanges',
        content: `
          <p>We offer free exchanges for different sizes or colors of the same item, subject to availability.</p>
          
          <h4>Exchange Process:</h4>
          <ol>
            <li>Follow the return process above</li>
            <li>Indicate "Exchange" in your return request</li>
            <li>Specify your preferred size/color</li>
            <li>We'll send your new item once we receive the return</li>
          </ol>
          
          <p><strong>Exchange Shipping:</strong> We cover the shipping cost for sending you the new item via PAXI standard delivery.</p>
          <p><strong>Price Differences:</strong> If the new item costs more, you'll be charged the difference. If it costs less, we'll refund the difference.</p>
          
          <h4>Size Exchange Tips:</h4>
          <ul>
            <li>Check our detailed size guide before ordering</li>
            <li>Contact us at +27 735 514 705 for size advice</li>
            <li>WhatsApp us photos for fit guidance</li>
          </ul>
        `
      },
      {
        title: 'Refunds',
        content: `
          <p>Refunds will be issued to your original payment method within 5-10 business days after we process your return.</p>
          
          <h4>Refund Policy:</h4>
          <ul>
            <li>Full refund for items in original condition</li>
            <li>Original shipping costs are refundable if return is due to our error</li>
            <li>Return shipping via PAXI is always free</li>
            <li>Bank transfer refunds may take 3-5 additional business days</li>
          </ul>
          
          <h4>Refund Methods:</h4>
          <ul>
            <li><strong>Credit/Debit Card:</strong> 5-10 business days</li>
            <li><strong>EFT/Bank Transfer:</strong> 7-14 business days</li>
            <li><strong>Store Credit:</strong> Instant (can be used immediately)</li>
          </ul>
          
          <p><strong>Quality Guarantee:</strong> If you receive a defective item, we'll provide a full refund including all shipping costs and arrange free collection via PAXI.</p>
        `
      }
    ]
  },
  help: {
    title: 'Help Center',
    lastUpdated: 'September 12, 2025',
    icon: HelpCircle,
    sections: [
      {
        title: 'Frequently Asked Questions',
        content: `
          <h4>How do I track my order?</h4>
          <p>Once your order ships via PAXI or PostNet, you'll receive an SMS and email with tracking information. You can also track your order by logging into your account and visiting the "Order History" section.</p>
          
          <h4>What if my item doesn't fit?</h4>
          <p>We offer free exchanges and returns within 2 days. You can return items via PAXI (free) or PostNet. Please refer to our size guide and return policy for more information.</p>
          
          <h4>Where can I collect my PAXI order?</h4>
          <p>PAXI orders can be collected from any PEP store nationwide - that's over 2,000 locations! You'll receive an SMS when your order arrives for collection.</p>
          
          <h4>How can I contact customer service?</h4>
          <p>You can reach us via email at hello@rosemamaclothing.store, call us at +27 735 514 705, or WhatsApp us. Our team is available Monday-Friday, 8 AM - 5 PM SAST.</p>
          
          <h4>Do you offer student discounts?</h4>
          <p>Yes! We offer a 10% student discount for South African students. Contact us with your student ID for verification.</p>
          
          <h4>What payment methods do you accept?</h4>
          <p>We accept all major South African credit and debit cards, EFT, Instant EFT, and mobile payment methods.</p>
          
          <h4>Do you ship to rural areas?</h4>
          <p>Yes! Both PAXI and PostNet have extensive networks reaching rural and remote areas across South Africa. Delivery times may be longer for very remote locations.</p>
        `
      },
      {
        title: 'Size Guide',
        content: `
          <h4>Women's Clothing Sizes</h4>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-gray-300">
              <thead>
                <tr class="bg-gray-50">
                  <th class="border border-gray-300 p-2">SA Size</th>
                  <th class="border border-gray-300 p-2">Int'l Size</th>
                  <th class="border border-gray-300 p-2">Bust (cm)</th>
                  <th class="border border-gray-300 p-2">Waist (cm)</th>
                  <th class="border border-gray-300 p-2">Hips (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td class="border border-gray-300 p-2">30</td><td class="border border-gray-300 p-2">XS</td><td class="border border-gray-300 p-2">81-86</td><td class="border border-gray-300 p-2">61-66</td><td class="border border-gray-300 p-2">86-91</td></tr>
                <tr><td class="border border-gray-300 p-2">32</td><td class="border border-gray-300 p-2">S</td><td class="border border-gray-300 p-2">86-91</td><td class="border border-gray-300 p-2">66-71</td><td class="border border-gray-300 p-2">91-96</td></tr>
                <tr><td class="border border-gray-300 p-2">34</td><td class="border border-gray-300 p-2">M</td><td class="border border-gray-300 p-2">91-96</td><td class="border border-gray-300 p-2">71-76</td><td class="border border-gray-300 p-2">96-101</td></tr>
                <tr><td class="border border-gray-300 p-2">36</td><td class="border border-gray-300 p-2">L</td><td class="border border-gray-300 p-2">96-101</td><td class="border border-gray-300 p-2">76-81</td><td class="border border-gray-300 p-2">101-106</td></tr>
                <tr><td class="border border-gray-300 p-2">38</td><td class="border border-gray-300 p-2">XL</td><td class="border border-gray-300 p-2">101-106</td><td class="border border-gray-300 p-2">81-86</td><td class="border border-gray-300 p-2">106-111</td></tr>
              </tbody>
            </table>
          </div>
          <p class="mt-4">For the most accurate fit, please measure yourself and compare to our size chart. If you're between sizes, we recommend sizing up. Need help? WhatsApp us at +27 735 514 705!</p>
        `
      },
      {
        title: 'Care Instructions & Local Tips',
        content: `
          <h4>General Care Tips for South African Climate</h4>
          <ul>
            <li>Always check the care label before washing</li>
            <li>Wash in cold water to prevent fading in our strong sun</li>
            <li>Air dry in shade - avoid direct sunlight which can fade colors</li>
            <li>During dry winter months, use fabric softener to prevent static</li>
            <li>Store items properly - avoid damp areas during rainy season</li>
          </ul>
          
          <h4>Special Care Items</h4>
          <p><strong>Delicates:</strong> Hand wash in cold water, especially during hot summer months</p>
          <p><strong>Denim:</strong> Wash inside out, hang in shade to prevent fading</p>
          <p><strong>Knitwear:</strong> Lay flat to dry - especially important in humid conditions</p>
          <p><strong>Light Colors:</strong> Extra care needed due to strong South African UV rays</p>
          
          <h4>Local Dry Cleaning</h4>
          <p>For items requiring professional cleaning, we recommend taking them to a reputable dry cleaner. Many PostNet locations also offer dry cleaning services.</p>
        `
      }
    ]
  },
  contact: {
    title: 'Contact Us',
    lastUpdated: 'September 12, 2025',
    icon: Phone,
    sections: [
      {
        title: 'Get in Touch',
        content: `
          <p>We're here to help! Reach out to us through any of the following methods:</p>
          
          <h4>Customer Service</h4>
          <ul>
            <li><strong>Email:</strong> hello@rosemamaclothing.store</li>
            <li><strong>Phone:</strong> +27 735 514 705</li>
            <li><strong>WhatsApp:</strong> +27 735 514 705</li>
            <li><strong>Hours:</strong> Monday-Friday, 8 AM - 5 PM SAST</li>
            <li><strong>Average Response Time:</strong> Within 24 hours</li>
          </ul>
          
          <h4>Business Address</h4>
          <p>Rosémama Clothing<br/>
          New Road<br/>
          Midrand, Gauteng<br/>
          South Africa</p>
          
          <h4>Shipping & Returns</h4>
          <p>All orders are processed and dispatched from our Midrand facility. We use PAXI (PEP) and PostNet courier services for reliable delivery throughout South Africa.</p>
        `
      },
      {
        title: 'Frequently Contacted About',
        content: `
          <h4>Order Support</h4>
          <p>Questions about your order, PAXI/PostNet tracking, or delivery issues</p>
          
          <h4>Returns & Exchanges</h4>
          <p>Help with returns, exchanges, or product issues - can be returned via PAXI or PostNet</p>
          
          <h4>Product Information</h4>
          <p>Size guidance, care instructions, or product availability</p>
          
          <h4>Courier Information</h4>
          <p>Questions about PAXI or PostNet delivery options, collection points, and tracking</p>
          
          <h4>Technical Support</h4>
          <p>Website issues, account problems, or payment difficulties</p>
          
          <h4>Wholesale Inquiries</h4>
          <p>For business partnerships and wholesale opportunities, email: wholesale@rosemamaclothing.store</p>
        `
      },
      {
        title: 'Social Media & Local Presence',
        content: `
          <p>Connect with us on social media for the latest updates, style inspiration, and exclusive offers:</p>
          <ul>
            <li><strong>Instagram:</strong> @rosemama_clothing</li>
            <li><strong>Facebook:</strong> /rosemamaclothing</li>
            <li><strong>TikTok:</strong> @rosemama_style</li>
            <li><strong>WhatsApp:</strong> +27 735 514 705</li>
          </ul>
          
          <h4>Local South African Service</h4>
          <p>We're proudly South African! Our customer service team understands local delivery challenges and can help you choose the best courier option for your area.</p>
          
          <p><strong>Courier Collection Points:</strong></p>
          <ul>
            <li><strong>PEP Stores:</strong> Over 2,000 locations nationwide</li>
            <li><strong>PostNet:</strong> Over 400 locations nationwide</li>
          </ul>
          
          <p>Tag us in your photos wearing Rosémama pieces for a chance to be featured! Use #RosemamaStyle #SouthAfricanFashion</p>
        `
      }
    ]
  }
};

export function PolicyPage({ type }: PolicyPageProps) {
  const content = policyContent[type];
  const IconComponent = content.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-2 rounded-full">
          <IconComponent className="h-4 w-4" />
          <span className="text-sm font-medium">{content.title}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {content.title}
        </h1>
        <p className="text-muted-foreground">
          Last updated: {content.lastUpdated}
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {content.sections.map((section, index) => (
          <div key={index} className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-b pb-2">
              {section.title}
            </h2>
            <div 
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        ))}
      </div>

      {/* Contact Footer */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Questions?</h3>
        <p className="text-muted-foreground mb-4">
          If you have any questions about this {content.title.toLowerCase()}, please don't hesitate to contact us.
        </p>
        <div className="flex gap-3 justify-center">
          <a 
            href="mailto:hello@rosemamaclothing.store"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}