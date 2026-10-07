/**
 * Stride Mobility - Document Templates Configuration
 * Defines metadata, legal preview content, and PDF field mapping rules.
 */

window.STRIDE_TEMPLATES = [
  {
    id: 'release_repairs',
    title: 'Authorization Form for Release of Information (Wheelchair Repairs)',
    shortTitle: 'Release Form Repairs',
    category: 'Authorization',
    badge: 'ROI Form',
    badgeClass: 'badge-roi',
    icon: '📄',
    description: 'Authorizes medical records release to Stride Mobility for submission to insurance for wheelchair repairs.',
    cost: null,
    templateFile: 'Release Form Repairs.pdf',
    embeddedKey: 'release_repairs',
    previewPages: ['release_repairs_page_1'],
    defaultSelected: true,
    pdfMapping: {
      type: 'release_repairs',
      patientFieldName: 'AUTHORIZATION FORM FOR RELEASE OF INFORMATION',
      releasingFieldName: 'I',
      expirationFields: { mm: 'undefined_2', dd: 'undefined_3', yyyy: 'or upon the occurrence' },
      signatureCoords: { x: 75, y: 148, width: 230, height: 24 },
      dateCoords: { mmX: 454, ddX: 486, yyyyX: 518, y: 148, size: 10 },
      printedNameCoords: { x: 75, y: 108, size: 10 }
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
    id: 'caresource_marketplace',
    title: 'CareSource Rep Form (Marketplace AOR)',
    shortTitle: 'CareSource Marketplace',
    category: 'Representative',
    badge: 'Marketplace',
    badgeClass: 'badge-rep',
    icon: '📋',
    description: 'Appointment of Representative (AOR) for CareSource Marketplace plans.',
    cost: null,
    templateFile: 'Rep Form Caresource Marketplace.pdf',
    embeddedKey: 'caresource_marketplace',
    previewPages: ['caresource_marketplace_page_1', 'caresource_marketplace_page_2'],
    defaultSelected: false,
    pdfMapping: {
      type: 'caresource_marketplace'
    }
  },
  {
    id: 'caresource_medicaid',
    title: 'CareSource Rep Form (Ohio Medicaid ODM 06723)',
    shortTitle: 'CareSource Medicaid',
    category: 'Representative',
    badge: 'CareSource OH',
    badgeClass: 'badge-rep',
    icon: '📋',
    description: 'Designation of Authorized Representative for CareSource Ohio Medicaid (ODM 06723 Rev. 5/2017).',
    cost: null,
    templateFile: 'Rep Form Caresource Medicaid.pdf',
    embeddedKey: 'caresource_medicaid',
    previewPages: ['caresource_medicaid_page_1', 'caresource_medicaid_page_2'],
    defaultSelected: false,
    pdfMapping: {
      type: 'caresource_medicaid'
    }
  },
  {
    id: 'caresource_mycare',
    title: 'CareSource Rep Form (MyCare Ohio / CMS-1696)',
    shortTitle: 'CareSource MyCare',
    category: 'Representative',
    badge: 'MyCare',
    badgeClass: 'badge-rep',
    icon: '📋',
    description: 'CMS-1696 Appointment of Representative for CareSource MyCare Ohio dual Medicare/Medicaid plans.',
    cost: null,
    templateFile: 'Rep Form Caresource MyCare.pdf',
    embeddedKey: 'caresource_mycare',
    previewPages: ['caresource_mycare_page_1', 'caresource_mycare_page_2'],
    defaultSelected: false,
    pdfMapping: {
      type: 'caresource_mycare'
    }
  },
  {
    id: 'rep_medicaid',
    title: 'Ohio Medicaid Rep Form (ODM 06723 Rev. 7/2025)',
    shortTitle: 'Medicaid Rep Form',
    category: 'Representative',
    badge: 'Medicaid',
    badgeClass: 'badge-rep',
    icon: '🏛️',
    description: 'Ohio Department of Medicaid Designation of Authorized Representative (ODM 06723 Rev. 7/2025).',
    cost: null,
    templateFile: 'Rep Form Medicaid.pdf',
    embeddedKey: 'rep_medicaid',
    previewPages: ['rep_medicaid_page_1', 'rep_medicaid_page_2', 'rep_medicaid_page_3'],
    defaultSelected: false,
    pdfMapping: {
      type: 'rep_medicaid'
    }
  },
  {
    id: 'medical_mutual',
    title: 'Medical Mutual Rep Form (Designation for Appeals & Info)',
    shortTitle: 'Medical Mutual Rep',
    category: 'Representative',
    badge: 'Medical Mutual',
    badgeClass: 'badge-rep',
    icon: '🏥',
    description: 'Medical Mutual of Ohio Designation of Authorized Representative for Appeals & Information.',
    cost: null,
    templateFile: 'Rep Form Medical Mutual.pdf',
    embeddedKey: 'medical_mutual',
    previewPages: ['medical_mutual_page_1', 'medical_mutual_page_2', 'medical_mutual_page_3'],
    defaultSelected: false,
    pdfMapping: {
      type: 'medical_mutual'
    }
  }
];
