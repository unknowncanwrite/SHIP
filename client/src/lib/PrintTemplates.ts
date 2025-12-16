import { ShipmentData } from '@/types/shipment';
import { format } from 'date-fns';

const formatDate = (dateString: string) => {
  if (!dateString) return '_________________';
  return format(new Date(dateString), 'dd-MMM-yyyy').toUpperCase();
};

export const printDeclaration = (data: ShipmentData) => {
  return `
    <html>
    <head>
      <title>Declaration - ${data.id}</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; text-decoration: underline; margin-bottom: 40px; font-size: 18pt; }
        p { margin-bottom: 15px; text-align: justify; }
        .signature { margin-top: 60px; }
        .bold { font-weight: bold; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>DECLARATION</h1>
      
      <p>The Commissioner of Customs,</p>
      <p>Customs & Excise Department,</p>
      <p><strong>MOMBASA.</strong></p>
      
      <br/>
      
      <p>Dear Sir/Madam,</p>
      
      <p>
        <strong>RE: IMPORTATION OF ${data.details.brand || 'GOODS'} 
        PER CONTAINER NO: ${data.details.container || '_________________'}
        IDF NO: ${data.details.idf || '_________________'}</strong>
      </p>
      
      <p>
        I, <strong>${data.details.consignee || '_________________'}</strong>, being the importer of the above mentioned goods, 
        do hereby declare that the values declared in the invoice number <strong>${data.details.commercialInv || '_________________'}</strong> 
        are the actual transaction values paid/payable for the goods.
      </p>
      
      <p>
        I further declare that the invoice submitted is genuine and the only one issued for this consignment. 
        I undertake to produce any other documents that may be required by customs for verification of value.
      </p>
      
      <p>Yours Faithfully,</p>
      
      <div class="signature">
        <p>__________________________</p>
        <p><strong>${data.details.consignee || 'Importer'}</strong></p>
        <p>Date: ${formatDate(data.details.inspectionDate)}</p>
      </div>
      
      <script>window.print();</script>
    </body>
    </html>
  `;
};

export const printUndertaking = (data: ShipmentData) => {
  return `
    <html>
    <head>
      <title>Undertaking - ${data.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.5; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        h2 { text-decoration: underline; margin-bottom: 20px; }
        .content { text-align: justify; }
        .footer { margin-top: 50px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>LETTER OF UNDERTAKING</h2>
      </div>
      
      <div class="content">
        <p>Date: ${formatDate(new Date().toISOString())}</p>
        <br/>
        <p>To: The Manager,</p>
        <p>Shipping Line / Agent,</p>
        <p>Mombasa.</p>
        <br/>
        
        <p>Dear Sir,</p>
        
        <p><strong>RE: CONTAINER GUARANTEE FOR ${data.details.container || '_________________'}</strong></p>
        
        <p>
          In consideration of your releasing the above container(s) to us for clearance and delivery to our premises, 
          we hereby undertake to return the said container(s) to your nominated empty depot in good condition and clean state.
        </p>
        
        <p>
          We further undertake to pay for any detention/demurrage charges that may accrue and repair costs for any 
          damages that may occur while the container is in our custody.
        </p>
        
        <p>
          <strong>Consignee:</strong> ${data.details.consignee || '_________________'}<br/>
          <strong>BL Number:</strong> ${data.details.booking || '_________________'}<br/>
          <strong>IDF Number:</strong> ${data.details.idf || '_________________'}
        </p>
      </div>
      
      <div class="footer">
        <p>For and on behalf of:</p>
        <br/><br/>
        <p>__________________________</p>
        <p>Authorised Signatory & Stamp</p>
      </div>
      
      <script>window.print();</script>
    </body>
    </html>
  `;
};

export const printShoesUndertaking = (data: ShipmentData) => {
  return `
    <html>
    <head>
      <title>Shoes Undertaking - ${data.id}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 40px; font-size: 14px; max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 30px; }
        p { margin-bottom: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>UNDERTAKING FOR USED SHOES</h1>
      
      <p><strong>IDF NO:</strong> ${data.details.idf}</p>
      <p><strong>IMPORTER:</strong> ${data.details.consignee}</p>
      <p><strong>CONTAINER:</strong> ${data.details.container}</p>
      
      <br/>
      
      <p>I/We hereby undertake that the used shoes imported in the above mentioned container(s) have been fumigated as per KEBS requirements.</p>
      
      <p>We declare that the shoes are:</p>
      <ul>
        <li>Clean and free from pests/diseases</li>
        <li>Fit for human use</li>
        <li>Not collected from hospital waste</li>
      </ul>
      
      <p>We accept full responsibility for any consequences arising from false declaration.</p>
      
      <br/><br/>
      <p>Signed: ____________________</p>
      <p>Date: ${formatDate(new Date().toISOString())}</p>
      
      <script>window.print();</script>
    </body>
    </html>
  `;
};
