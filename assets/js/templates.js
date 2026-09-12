/**
 * Stride Mobility - Document Templates Configuration
 * Defines metadata, legal preview content, and PDF field mapping rules.
 */

window.STRIDE_TEMPLATES = [
  {
    id: 'roi',
    title: 'Authorization Form for Release of Information (ROI)',
    shortTitle: 'Medical Release (ROI)',
    category: 'Authorization',
    badge: 'ROI Form',
    badgeClass: 'badge-roi',
    icon: '📄',
    description: 'Authorizes medical records release to Stride Mobility to submit authorization, complete, and bill for wheelchair & repair.',
    cost: null,
    templateFile: 'roi_template.pdf',
    embeddedKey: 'roi_template',
    previewPages: ['roi_template_page_1'],
    defaultSelected: true,
    pdfMapping: {
      type: 'direct_draw',
      patientName: { x: 85, y: 662, size: 10.5 },
      releasingOrg: { x: 80, y: 635, size: 10 },
      expiration: { x: 210, y: 298, size: 10 },
      signature: { x: 80, y: 122, width: 230, height: 38 },
      date: { x: 445, y: 135, size: 10 },
      printedName: { x: 80, y: 94, size: 10.5 },
      repAuthority: { x: 80, y: 54, size: 9.5 }
    }
  },
  {
    id: 'abn_k0862',
    title: 'ABN - K0862 HD Power Wheelchair',
    shortTitle: 'ABN: K0862 HD Power',
    category: 'ABN Notice',
    badge: '$20,000 Est.',
    badgeClass: 'badge-abn',
    icon: '⚡',
    itemCode: 'K0862',
    itemDesc: 'K0862 HD Power Wheelchair',
    description: 'Advance Beneficiary Notice for heavy duty power wheelchair. Option 1 pre-selected to bill payor.',
    reason: 'Not a covered benefit.  Beneficiary lives in a long term care facility.',
    cost: '20000',
    templateFile: 'abn_k0862.pdf',
    embeddedKey: 'abn_k0862',
    previewPages: ['abn_k0862_page_1'],
    defaultSelected: false,
    pdfMapping: {
      type: 'acroform_and_draw',
      patientFieldName: 'PatientName',
      payorFieldName: 'PayorName',
      dateFieldName: 'Date mmddyyyy',
      signatureCoords: { x: 45, y: 116, width: 230, height: 26 }
    }
  },
  {
    id: 'abn_k0861',
    title: 'ABN - K0861 Power Wheelchair',
    shortTitle: 'ABN: K0861 Power',
    category: 'ABN Notice',
    badge: '$20,000 Est.',
    badgeClass: 'badge-abn',
    icon: '⚡',
    itemCode: 'K0861',
    itemDesc: 'K0861 Power Wheelchair',
    description: 'Advance Beneficiary Notice for standard power wheelchair. Option 1 pre-selected to bill payor.',
    reason: 'Not a covered benefit.  Beneficiary lives in a long term care facility.',
    cost: '20000',
    templateFile: 'abn_k0861.pdf',
    embeddedKey: 'abn_k0861',
    previewPages: ['abn_k0861_page_1'],
    defaultSelected: false,
    pdfMapping: {
      type: 'acroform_and_draw',
      patientFieldName: 'PatientName',
      payorFieldName: 'PayorName',
      dateFieldName: 'Date mmddyyyy',
      signatureCoords: { x: 45, y: 116, width: 230, height: 26 }
    }
  },
  {
    id: 'abn_k0863',
    title: 'ABN - K0863 Ultra-HD Power Wheelchair',
    shortTitle: 'ABN: K0863 Ultra-HD',
    category: 'ABN Notice',
    badge: '$20,000 Est.',
    badgeClass: 'badge-abn',
    icon: '⚡',
    itemCode: 'K0863',
    itemDesc: 'K0863 Ultra-HD Power Wheelchair',
    description: 'Advance Beneficiary Notice for ultra heavy-duty power wheelchair. Option 1 pre-selected to bill payor.',
    reason: 'Not a covered benefit.  Beneficiary lives in a long term care facility.',
    cost: '20000',
    templateFile: 'abn_k0863.pdf',
    embeddedKey: 'abn_k0863',
    previewPages: ['abn_k0863_page_1'],
    defaultSelected: false,
    pdfMapping: {
      type: 'acroform_and_draw',
      patientFieldName: 'PatientName',
      payorFieldName: 'PayorName',
      dateFieldName: 'Date mmddyyyy',
      signatureCoords: { x: 45, y: 116, width: 230, height: 26 }
    }
  },
  {
    id: 'abn_k0005',
    title: 'ABN - K0005 Ultralight Manual Wheelchair',
    shortTitle: 'ABN: K0005 Ultralight',
    category: 'ABN Notice',
    badge: '$10,000 Est.',
    badgeClass: 'badge-abn',
    icon: '🦽',
    itemCode: 'K0005',
    itemDesc: 'K0005 Ultralight Manual Wheelchair',
    description: 'Advance Beneficiary Notice for ultralight manual wheelchair. Option 1 pre-selected to bill payor.',
    reason: 'Not a covered benefit.  Beneficiary lives in a long term care facility.',
    cost: '10000',
    templateFile: 'abn_k0005.pdf',
    embeddedKey: 'abn_k0005',
    previewPages: ['abn_k0005_page_1'],
    defaultSelected: false,
    pdfMapping: {
      type: 'acroform_and_draw',
      patientFieldName: 'PatientName',
      payorFieldName: 'PayorName',
      dateFieldName: 'Date mmddyyyy',
      signatureCoords: { x: 45, y: 116, width: 230, height: 26 }
    }
  },
  {
    id: 'abn_e1161',
    title: 'ABN - E1161 Tilt-In-Space Wheelchair',
    shortTitle: 'ABN: E1161 Tilt-In-Space',
    category: 'ABN Notice',
    badge: '$15,000 Est.',
    badgeClass: 'badge-abn',
    icon: '♿',
    itemCode: 'E1161',
    itemDesc: 'E1161 Tilt-In-Space Wheelchair',
    description: 'Advance Beneficiary Notice for tilt-in-space wheelchair. Option 1 pre-selected to bill payor.',
    reason: 'Not a covered benefit.  Beneficiary lives in a long term care facility.',
    cost: '15000',
    templateFile: 'abn_e1161.pdf',
    embeddedKey: 'abn_e1161',
    previewPages: ['abn_e1161_page_1'],
    defaultSelected: false,
    pdfMapping: {
      type: 'acroform_and_draw',
      patientFieldName: 'PatientName',
      payorFieldName: 'PayorName',
      dateFieldName: 'Date mmddyyyy',
      signatureCoords: { x: 45, y: 116, width: 230, height: 26 }
    }
  },
  {
    id: 'caresource_rep',
    title: 'CareSource Rep Form (Consent to File Appeal)',
    shortTitle: 'CareSource Rep Form',
    category: 'Representative',
    badge: 'CareSource',
    badgeClass: 'badge-rep',
    icon: '📋',
    description: 'Consent for Stride Mobility Group to file an appeal on patient/member behalf with CareSource.',
    cost: null,
    templateFile: 'caresource_rep.pdf',
    embeddedKey: 'caresource_rep',
    previewPages: ['caresource_rep_page_1'],
    defaultSelected: false,
    pdfMapping: {
      type: 'caresource_rep',
      patientName: { x: 53, y: 328, size: 10 },
      signature: { x: 53, y: 236, width: 220, height: 32 },
      date: { x: 375, y: 246, size: 10 },
      repName: { x: 53, y: 122, size: 10 },
      repRelationship: { x: 375, y: 122, size: 10 },
      repSignature: { x: 53, y: 72, width: 220, height: 30 },
      repDate: { x: 375, y: 80, size: 10 }
    }
  },
  {
    id: 'stride_rep',
    title: 'Stride Rep Form (CMS-1696 Appointment of Representative)',
    shortTitle: 'Stride Rep (CMS-1696)',
    category: 'Representative',
    badge: 'CMS-1696',
    badgeClass: 'badge-rep',
    icon: '⚖️',
    description: 'CMS-1696 Appointment of Representative appointing Stride Mobility to act on patient behalf.',
    cost: null,
    templateFile: 'stride_rep.pdf',
    embeddedKey: 'stride_rep',
    previewPages: ['stride_rep_page_1', 'stride_rep_page_2'],
    defaultSelected: false,
    pdfMapping: {
      type: 'stride_rep',
      patientName: { x: 42, y: 686, size: 13 },
      appointedRep: { x: 140, y: 640, size: 10 },
      signature: { x: 45, y: 548, width: 190, height: 18 },
      date: { x: 435, y: 554, size: 10.5 }
    }
  }
];
