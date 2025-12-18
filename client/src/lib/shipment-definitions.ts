import { ShipmentData } from "@/types/shipment";

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export interface TaskDefinition {
  id: string;
  label: string;
  hasEmail?: boolean;
  emailSubject?: string | ((data: ShipmentData) => string);
  emailBody?: string | ((data: ShipmentData) => string);
  emailTo?: string | ((data: ShipmentData) => string);
  emailCC?: string | ((data: ShipmentData) => string);
  isWhatsApp?: boolean;
  whatsappBody?: string | ((data: ShipmentData) => string);
  needsAttachmentCheck?: boolean;
  note?: string;
  subTasks?: string[];
  hideSubject?: boolean;
}

export const PHASE_1_TASKS: TaskDefinition[] = [
  { 
    id: 'p1_docs', 
    label: 'Prepare Inspection Documents & send to SGS', 
    hasEmail: true,
    needsAttachmentCheck: true,
    emailTo: 'Fazila.Shaikh@sgs.com',
    emailCC: 'Saqib.Qadeer@sgs.com, export@amrags.com, Muhammad.ShoaibSiddiqui@sgs.com, Syed.Mahboob@sgs.com, imp-exp@amrags.com',
    emailSubject: (d) => `IDEAS RECYCLING (PVT) LTD, ${d.commercial.invoice} - ${d.details.idf} - ${d.details.consignee} - INSPECTION REQ - ${formatDate(d.details.inspectionDate)}`,
    emailBody: (d) => `Dear Saqib/Fazila,

Please see attached Documents, kindly arrange inspection for ${formatDate(d.details.inspectionDate)}.
Attached - RFC, declaration, IDF & Commercial Invoice.`
  },
  { id: 'p1_fumigation', label: 'Book Fumigation (WhatsApp)', isWhatsApp: true, needsAttachmentCheck: true, emailTo: 'HASSAN SKY FUMIGATION (03332990665)' },
];

export const PHASE_2_TASKS: TaskDefinition[] = [
  { 
    id: 'p2_mail', 
    label: 'Send Fumigation Docs', 
    hasEmail: true,
    needsAttachmentCheck: true,
    emailSubject: (d) => `INV ${d.commercial.invoice || d.id} Fumigation Request`, 
    emailBody: () => `Please find Commercial Invoice & Packing List attached.` 
  },
  { id: 'p2_attachments', label: 'Docs sent to Agent' },
  { id: 'p2_fum_cert_verify', label: 'Receive & Verify Fumigation Certificate as per Documents' },
  { id: 'p3a_docs', label: 'Reply to SGS Inspection Thread' },
];

export const PHASE_3_TASKS: TaskDefinition[] = [
  { 
    id: 'p3_prepare_docs', 
    label: 'PREPARE DOCUMENT'
  },
  { 
    id: 'p3a_sgs_docs', 
    label: 'Send Shipment Documents to SGS for COC Draft', 
    hasEmail: true,
    needsAttachmentCheck: true,
    emailBody: () => `Please see attached documents, and send payment invoice and COC Draft.`,
    note: 'Reply to the original SGS inspection email.',
    hideSubject: true
  },
  { id: 'p3b_draft', label: 'Receive & Verify Draft' },
  { id: 'p3b_pay', label: 'Process SGS Payment' },
  { 
    id: 'p3b_confirm', 
    label: 'Request Final COC', 
    hasEmail: true,
    needsAttachmentCheck: true,
    emailBody: () => `COC Draft Confirmed. Payment attached. Please issue Final.`,
    note: 'Reply to the original SGS inspection email.',
    hideSubject: true,
    subTasks: ['CONFIRM ATTACHMENT: SGS PAYMENT INVOICE & SGS PAYMENT CHECK']
  },
];

export const getForwarderTasks = (data: ShipmentData): TaskDefinition[] => {
  const forwarderName = data.manualForwarderName || 'Forwarder';
  const isWithInspection = data.shipmentType === 'with-inspection';
  const blDraftLabel = isWithInspection 
    ? 'PREPARE BL DRAFT AS PER INSPECTION DOCUMENTS' 
    : 'PREPARE BL DRAFT AS PER ACTUAL LOADED';
    
  return [
    { 
      id: 'p4_prepare_bl', 
      label: blDraftLabel
    },
    { 
      id: 'p4_send_bl_draft', 
      label: `SEND BL DRAFT TO ${forwarderName} VIA ${data.manualMethod === 'whatsapp' ? 'WHATSAPP' : 'EMAIL'}`,
      hasEmail: data.manualMethod !== 'whatsapp',
      isWhatsApp: data.manualMethod === 'whatsapp',
      needsAttachmentCheck: true,
      emailSubject: (d) => `Draft Bill of Lading (BL) Attached - ${d.details.container} - ${d.commercial.invoice}`, 
      emailBody: (d) => `Please find attached the draft Bill of Lading (BL).
Against Container Number - ${d.details.container}
Booking Number - ${d.details.booking}`,
      whatsappBody: (d) => `draft Bill of Lading (BL).
Container: ${d.details.container}
BOOKING NUMBER: ${d.details.booking}`
    }
  ];
};

export const getFumigationTasks = (data: ShipmentData): TaskDefinition[] => {
  const providerName = data.fumigation === 'sky-services' 
    ? 'Sky Services' 
    : data.fumigation === 'sgs' 
    ? 'SGS' 
    : data.manualFumigationName || 'Fumigation Provider';
    
  return [
    { 
      id: 'p2_fum_docs', 
      label: `${providerName}: Send Required Docs for Fumigation Certificate`, 
      hasEmail: true,
      needsAttachmentCheck: true,
      emailTo: 'skyservices2k19@gmail.com',
      emailSubject: (d) => `Fumigation Certificate Request - INV# ${d.commercial.invoice || d.id}`, 
      emailBody: () => `Please find attached the required documents for fumigation certificate processing. Kindly arrange the fumigation certificate at your earliest convenience.` 
    },
    { id: 'p2_fum_cert_verify', label: 'Receive & Verify Fumigation Certificate as per Documents' }
  ];
};
