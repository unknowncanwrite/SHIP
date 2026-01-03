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
        body { font-family: 'Times New Roman', serif; padding: 250px 40px 50px 40px; line-height: 1.6; max-width: 850px; margin: 0 auto; }
        .date { text-align: right; margin-bottom: 100px; font-size: 12pt; }
        .spacer-before { height: 20px; }
        h1 { text-align: center; text-decoration: underline; margin: 20px 0; font-size: 16pt; letter-spacing: 1px; }
        .declaration-text { text-align: justify; margin: 30px 0; line-height: 1.7; font-size: 11pt; }
        .details-section { margin-top: 40px; margin-bottom: 60px; }
        .detail-line { margin: 8px 0; font-size: 11pt; }
        .company-name { text-align: left; margin-top: 100px; font-size: 12pt; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="date">${formatDate(data.details.inspectionDate || new Date().toISOString())}</div>
      <div class="spacer-before"></div>
      
      <h1>DECLARATION</h1>
      
      <div class="declaration-text">
        We undertake that we import ${data.details.brand || 'used clothing'} from USA, inspected by SGS Pakistan, export to ${data.details.consignee || 'M/s Safqa Limited'}, Mombasa, Kenya vide
      </div>
      
      <div class="details-section">
        <div class="detail-line">IDF# ${data.details.idf || '_________________'},</div>
        <div class="detail-line">UCR # ${data.details.ucr || '_________________'}</div>
        <div class="detail-line">PFI# : ${data.details.proforma || '_________________'}</div>
        <div class="detail-line">CNTR# ${data.details.container || '_________________'}</div>
      </div>
      
      <div class="company-name">
        IDEAS RECYCLING PVT LTD
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
        body { font-family: Arial, sans-serif; padding: 250px 40px 50px 40px; line-height: 1.5; max-width: 800px; margin: 0 auto; }
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
        body { font-family: 'Courier New', monospace; padding: 250px 40px 50px 40px; font-size: 14px; max-width: 800px; margin: 0 auto; }
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
