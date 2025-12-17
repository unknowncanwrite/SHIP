import { ShipmentData } from "@/types/shipment";

export interface TaskDefinition {
  id: string;
  label: string;
  hasEmail?: boolean;
  emailSubject?: string | ((data: ShipmentData) => string);
  emailBody?: string | ((data: ShipmentData) => string);
}

export const PHASE_1_TASKS: TaskDefinition[] = [
  { id: 'p1_docs', label: 'Prepare Inspection Documents & send to SGS' },
  { 
    id: 'p1_mail', 
    label: 'Send Mail to Forwarder', 
    hasEmail: true, 
    emailSubject: (d) => `Shipment ${d.id} - Docs`, 
    emailBody: (d) => `Please process the attached documents for shipment ${d.id}.` 
  },
  { id: 'p1_attachments', label: 'Check Attachments' },
  { id: 'p1_fumigation', label: 'Book Fumigation (WhatsApp)' },
];

export const PHASE_2_TASKS: TaskDefinition[] = [
  { 
    id: 'p2_mail', 
    label: 'Send Fumigation Docs', 
    hasEmail: true, 
    emailSubject: (d) => `INV ${d.commercial.invoice || d.id} Fumigation Request`, 
    emailBody: () => `Please find Commercial Invoice & Packing List attached.` 
  },
  { id: 'p2_attachments', label: 'Docs sent to Agent' },
  { id: 'p3a_docs', label: 'Reply to SGS Inspection Thread' },
];

export const PHASE_3_TASKS: TaskDefinition[] = [
  { id: 'p3b_draft', label: 'Receive & Verify Draft' },
  { id: 'p3b_pay', label: 'Process SGS Payment' },
  { 
    id: 'p3b_confirm', 
    label: 'Request Final COC', 
    hasEmail: true, 
    emailSubject: (d) => `COC Finalization - ${d.id}`, 
    emailBody: () => `COC Draft Confirmed. Payment attached. Please issue Final.` 
  },
];

export const getForwarderTasks = (data: ShipmentData): TaskDefinition[] => {
  if (data.forwarder === 'xpo') {
    return [
       { id: 'p4_xpo_booking', label: 'XPO: Confirm Booking' },
       { id: 'p4_xpo_loading', label: 'XPO: Confirm Loading' },
       { 
         id: 'p4_xpo_docs', 
         label: 'XPO: Send Final Docs', 
         hasEmail: true, 
         emailSubject: (d) => `Final Docs - ${d.id}`, 
         emailBody: () => `Please find attached final documents.` 
       }
    ];
  } else if (data.forwarder === 'hmi') {
    return [
       { id: 'p4_hmi_whatsapp', label: 'HMI: Send WhatsApp Confirmation' },
       { id: 'p4_hmi_loading', label: 'HMI: Confirm Loading' }
    ];
  } else {
    const forwarderName = data.manualForwarderName || 'Forwarder';
    return [
       { id: 'p4_manual_contact', label: `${forwarderName}: Contact via ${data.manualMethod}` },
       { id: 'p4_manual_docs', label: `${forwarderName}: Send Documents` }
    ];
  }
};

export const getFumigationTasks = (data: ShipmentData): TaskDefinition[] => {
  if (data.fumigation === 'sky-services') {
    return [
       { id: 'p2_sky_booking', label: 'Sky Services: Book Fumigation' },
       { 
         id: 'p2_sky_docs', 
         label: 'Sky Services: Send Required Docs', 
         hasEmail: true, 
         emailSubject: (d) => `Fumigation Request - ${d.id}`, 
         emailBody: () => `Please find attached the required documents for fumigation.` 
       },
       { id: 'p2_sky_confirm', label: 'Sky Services: Confirm Fumigation Date' }
    ];
  } else if (data.fumigation === 'sgs') {
    return [
       { id: 'p2_sgs_booking', label: 'SGS: Initiate Fumigation' },
       { 
         id: 'p2_sgs_docs', 
         label: 'SGS: Submit Documentation', 
         hasEmail: true, 
         emailSubject: (d) => `SGS Fumigation - ${d.id}`, 
         emailBody: () => `Please find attached the required documents for SGS fumigation.` 
       },
       { id: 'p2_sgs_confirm', label: 'SGS: Receive Fumigation Confirmation' }
    ];
  } else {
    const providerName = data.manualFumigationName || 'Fumigation Provider';
    return [
       { id: 'p2_manual_fum_contact', label: `${providerName}: Contact via ${data.manualFumigationMethod}` },
       { id: 'p2_manual_fum_docs', label: `${providerName}: Send Fumigation Documents` },
       { id: 'p2_manual_fum_confirm', label: `${providerName}: Confirm Fumigation Completion` }
    ];
  }
};
