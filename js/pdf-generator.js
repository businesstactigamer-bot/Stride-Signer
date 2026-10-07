/**
 * Stride Mobility - Client-Side PDF Generation Engine
 * Uses pdf-lib to stamp official templates with patient demographics & signatures.
 */

class StridePdfGenerator {
  constructor() {
    this.pdfLib = window.PDFLib;
  }

  /**
   * Helper to convert base64 string to Uint8Array
   */
  base64ToUint8Array(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Loads template bytes from embedded base64 cache or falls back to fetch()
   */
  async loadTemplateBytes(templateDef) {
    // 1. Try embedded cache (offline / file:// safe)
    if (window.STRIDE_TEMPLATES_DATA && window.STRIDE_TEMPLATES_DATA[templateDef.embeddedKey]) {
      const b64 = window.STRIDE_TEMPLATES_DATA[templateDef.embeddedKey];
      return this.base64ToUint8Array(b64);
    }

    // 2. Fetch from static folder if served via HTTP server
    const url = `assets/templates/${templateDef.templateFile}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load template ${templateDef.templateFile}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Helper to split full name into first and last
   */
  splitName(fullName) {
    const parts = (fullName || '').trim().split(/\s+/);
    if (parts.length <= 1) return { first: parts[0] || '', last: '' };
    const last = parts.pop();
    const first = parts.join(' ');
    return { first, last };
  }

  /**
   * Helper to parse MM/DD/YYYY date
   */
  parseDateParts(dateStr) {
    if (!dateStr) return { mm: '', dd: '', yyyy: '' };
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const mm = parts[0].padStart(2, '0');
      const dd = parts[1].padStart(2, '0');
      const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return { mm, dd, yyyy };
    }
    return { mm: '', dd: '', yyyy: dateStr };
  }

  /**
   * Helper to calculate 1-year expiration date
   */
  calcExpiration(dateStr) {
    const d = this.parseDateParts(dateStr);
    if (!d.yyyy) return { mm: '09', dd: '12', yyyy: '2027' };
    const curY = parseInt(d.yyyy, 10);
    const nextY = String(isNaN(curY) ? 2027 : (curY < 100 ? curY + 2001 : curY + 1));
    return { mm: d.mm || '01', dd: d.dd || '01', yyyy: nextY };
  }

  /**
   * Helper to draw a signature image proportionally into a target bounding box.
   * Scales the signature to fit within (maxWidth, maxHeight) while preserving
   * its exact natural aspect ratio whether signed in portrait or landscape mode,
   * and positions it cleanly on the designated baseline.
   */
  drawSignatureProportional(page, sigImage, targetX, baselineY, maxWidth, maxHeight) {
    if (!sigImage || !page) return;

    const imgWidth = sigImage.width;
    const imgHeight = sigImage.height;
    if (!imgWidth || !imgHeight) return;

    const aspect = imgWidth / imgHeight;

    let drawW = maxWidth;
    let drawH = drawW / aspect;

    if (drawH > maxHeight) {
      drawH = maxHeight;
      drawW = drawH * aspect;
    }

    if (drawW > maxWidth) {
      drawW = maxWidth;
      drawH = drawW / aspect;
    }

    page.drawImage(sigImage, {
      x: targetX,
      y: baselineY,
      width: drawW,
      height: drawH
    });
  }

  /**
   * Generates a single stamped PDF for a template definition
   */
  async generateDocument(templateDef, sessionData, signaturePngDataUrl) {
    const { PDFDocument, rgb, StandardFonts } = this.pdfLib;
    
    // Load original template PDF
    const templateBytes = await this.loadTemplateBytes(templateDef);
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Embed patient signature PNG
    let sigImage = null;
    if (signaturePngDataUrl) {
      sigImage = await pdfDoc.embedPng(signaturePngDataUrl);
    }

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const secondPage = pages.length > 1 ? pages[1] : null;
    const thirdPage = pages.length > 2 ? pages[2] : null;

    let form = null;
    try {
      form = pdfDoc.getForm();
    } catch (e) {
      form = null;
    }

    const safeSetText = (fieldName, text) => {
      if (!form) return;
      try {
        const field = form.getTextField(fieldName);
        if (field) field.setText(text || '');
      } catch (e) {}
    };

    const safeCheck = (fieldName) => {
      if (!form) return;
      try {
        const cb = form.getCheckBox(fieldName);
        if (cb) cb.check();
      } catch (e) {}
    };

    const atpName = (sessionData.atpName && sessionData.atpName.trim()) || 'Tim Sanders, ATP';
    const atpEmail = (sessionData.atpEmail && sessionData.atpEmail.trim()) || 'info@stridemobility.com';
    const dp = this.parseDateParts(sessionData.date);

    if (templateDef.id === 'release_repairs') {
      // ========================================================
      // 1. Release Form Repairs (Medical Release - Wheelchair Repairs)
      // ========================================================
      
      // Patient Name (Line: I, _________, give permission to:)
      // Set ONLY via AcroForm field - DO NOT drawText to avoid double-printing
      if (sessionData.patientName) {
        safeSetText('AUTHORIZATION FORM FOR RELEASE OF INFORMATION', sessionData.patientName.toUpperCase());
      }

      // Releasing Organization (PCP or Ohio Vendor entered by ATP, e.g. NPL Home Medical)
      // Set ONLY via AcroForm field - DO NOT drawText to avoid double-printing
      const releasing = (sessionData.releasingOrg && sessionData.releasingOrg.trim()) || 'Primary Care Physician / Medical Records';
      safeSetText('I', releasing);

      // Expiration Date: Exactly 1 year from signature date
      // Set ONLY via AcroForm fields - DO NOT drawText to avoid double-printing
      const exp = this.calcExpiration(sessionData.date);
      safeSetText('undefined_2', exp.mm);
      safeSetText('undefined_3', exp.dd);
      safeSetText('or upon the occurrence', exp.yyyy);

      // Patient / Rep Signature - Raised into designated signature line (baseline y = 146)
      if (sigImage) {
        this.drawSignatureProportional(firstPage, sigImage, 75, 148, 230, 24);
      }

      // Date: Slots on signature line (Date _____/_____/________ at y = 146)
      if (sessionData.date) {
        firstPage.drawText(dp.mm, { x: 454, y: 148, size: 10, font: helveticaBold, color: rgb(0.05, 0.05, 0.1) });
        firstPage.drawText(dp.dd, { x: 486, y: 148, size: 10, font: helveticaBold, color: rgb(0.05, 0.05, 0.1) });
        firstPage.drawText(dp.yyyy, { x: 518, y: 148, size: 10, font: helveticaBold, color: rgb(0.05, 0.05, 0.1) });
      }

      // Printed Name (Printed Name line is at baseline y = 105.85)
      const printedName = sessionData.signerType === 'representative' && sessionData.repName
        ? `${sessionData.repName} (Rep for ${sessionData.patientName})`
        : sessionData.patientName;
      
      // Clear the AcroForm field 'Printed Name...' because in this template that widget is mislocated down on line 3 (y=64)
      safeSetText('Printed Name of PatientParticipant or Personal Authorized Representative', '');

      if (printedName) {
        firstPage.drawText(printedName, {
          x: 75,
          y: 108,
          size: 10,
          font: helveticaBold,
          color: rgb(0.05, 0.05, 0.1)
        });
      }

      // Note: Bottom line (Description of Personal Representative's Authority) is left empty as requested

      if (form) {
        try { form.flatten(); } catch (e) {}
      }

    } else if (templateDef.id === 'caresource_marketplace') {
      // ========================================================
      // 2. CareSource Marketplace Rep Form (AOR)
      // ========================================================
      // Page 1: Appointing representative - ONLY AcroForm, NO manual drawText
      safeSetText('Name of person you are appointing as an Authorized Representative', atpName);

      // Stride Mobility contact info
      safeSetText('Text1', '2455 Sawmill Parkway, Huron, OH 44839');
      safeSetText('Text2', '(419) 616-6017');
      safeSetText('Text3', atpEmail);
      safeSetText('Text4', '(419) 754-2692');

      // Covered person info - ONLY AcroForm, NO manual drawText
      safeSetText('Text5', sessionData.patientName);

      safeSetText('I', sessionData.patientName);
      safeSetText('Member Name appoint', atpName);

      // Page 2: Signatures & Dates
      if (secondPage) {
        if (sigImage) {
          this.drawSignatureProportional(secondPage, sigImage, 55, 632, 280, 28);
        }
        safeSetText('Date', sessionData.date);

        // Rep Acceptance
        safeSetText('I_1', atpName);
        safeSetText('hereby accept the above appointment I am aan', 'Mobility Equipment Supplier / ATP');
        safeSetText('Date_1', sessionData.date);
      }

      if (form) {
        try { form.flatten(); } catch (e) {}
      }

    } else if (templateDef.id === 'caresource_medicaid') {
      // ========================================================
      // 3. CareSource Ohio Medicaid (ODM 06723 Rev. 5/2017)
      // ========================================================
      // Page 1: Section 1 - ONLY AcroForm, NO manual drawText
      safeSetText('Name of ApplicantRecipient', sessionData.patientName);
      safeSetText('Date or Event', '1 Year from Date of Signature');
      safeSetText('Name of Representative', atpName);
      safeSetText('Title', 'ATP / Mobility Representative');
      safeSetText('Company', 'Stride Mobility Group LLC');
      safeSetText('Work Phone', '419-616-6017');
      safeSetText('Email Address', atpEmail);
      safeSetText('Mailing Address', '2455 Sawmill Parkway');
      safeSetText('City_2', 'Huron');
      safeSetText('State_2', 'OH');
      safeSetText('Zip_2', '44839');

      safeCheck('Act on my behalf in all matters with the agency agency includes the County Department of Job and Family');

      // Page 1: Signature
      if (sigImage) {
        this.drawSignatureProportional(firstPage, sigImage, 40, 150, 240, 24);
      }
      safeSetText('Text4', sessionData.date);

      safeSetText('Title (if employee of an organization)', 'ATP');
      // "Date (mm/dd/yyyy)" populates both Page 1 Rep Date and Page 2 Applicant Date
      safeSetText('Date (mm/dd/yyyy)', sessionData.date);

      // Page 2: Section 2 - PHI Authorization
      if (secondPage) {
        safeSetText('Name of ApplicantRecipient_2', sessionData.patientName);
        safeSetText('This protected health information may be disclosed', 'All records and information necessary for wheelchair evaluation, authorization, billing and repairs.');
        safeSetText('The information is being released for the following purposes', 'Wheelchair procurement, prior authorization, insurance claim submission and repair services.');
        safeSetText('Date or Event 1', '1 Year from Signature');

        if (sigImage) {
          this.drawSignatureProportional(secondPage, sigImage, 50, 115, 240, 26);
        }
      }

      if (form) {
        try { form.flatten(); } catch (e) {}
      }

    } else if (templateDef.id === 'caresource_mycare') {
      // ========================================================
      // 4. CareSource MyCare Ohio (CMS-1696 Appointment of Representative)
      // ========================================================
      // Page 1: Section 1 (Patient) - ONLY AcroForm, NO manual drawText
      safeSetText('Name', sessionData.patientName);

      // Section 1 Signature & Date
      if (sigImage) {
        this.drawSignatureProportional(firstPage, sigImage, 40, 485, 220, 20);
      }
      safeSetText('Date s', dp.mm);
      safeSetText('Text4', dp.dd);
      safeSetText('gned mmddyyyy', dp.yyyy);

      // Page 1: Section 2 (Representative)
      // In CMS-1696 template, field "Professional status..." is at y=423 (Representative name line),
      // and field "Text2" is at y=393 (Professional status line).
      safeSetText('Professional status or relationship to the person in Section 1 attorney relative etc', atpName);
      safeSetText('Text2', 'Assistive Technology Professional (ATP) / Mobility Supplier');
      safeSetText('Mailing address_2', '2455 Sawmill Parkway');
      safeSetText('Text1', 'Huron');
      safeSetText('State_2', 'OH');
      safeSetText('undefined', '44839');
      safeSetText('Phone number w_2', '(419) 616-6017');
      safeSetText('Email optional_2', atpEmail);
      safeSetText('Fax optional_2', '(419) 754-2692');

      // Rep signature & date (Section 2)
      safeSetText('Signature_2', atpName);
      safeSetText('Date s_2', dp.mm);
      safeSetText('Text3', dp.dd);
      safeSetText('gned mmddyyyy_2', dp.yyyy);

      // Page 1: Section 3 (Waiver of fee)
      safeSetText('Text6', atpName);
      safeSetText('Date s_3', dp.mm);
      safeSetText('undefined_4', dp.dd);
      safeSetText('gned mmddyyyy_3', dp.yyyy);

      if (form) {
        try { form.flatten(); } catch (e) {}
      }

    } else if (templateDef.id === 'rep_medicaid') {
      // ========================================================
      // 5. Ohio Medicaid Rep Form (ODM 06723 Rev. 7/2025)
      // ========================================================
      const nameParts = this.splitName(sessionData.patientName);
      safeSetText('First Name of ApplicantRecipient', nameParts.first);
      safeSetText('Last Name of ApplicantRecipient', nameParts.last);
      safeSetText('This authority lasts until', '1 Year from Date of Signature');
      safeSetText('Name of Representative', atpName);
      safeSetText('Title', 'ATP / Mobility Representative');
      safeSetText('Company', 'Stride Mobility Group LLC');
      safeSetText('Work Phone', '419-616-6017');
      safeSetText('Email Address', atpEmail);
      safeSetText('Mailing Address', '2455 Sawmill Parkway');
      safeSetText('City_2', 'Huron');
      safeSetText('State_2', 'OH');
      safeSetText('Zip Code_2', '44839');

      safeCheck('Act on my behalf in all matters with the agency agency includes the County Department of Job and Family');

      // Signature & Date
      if (sigImage) {
        this.drawSignatureProportional(firstPage, sigImage, 32, 133, 240, 22);
      }
      safeSetText('Date', sessionData.date);

      safeSetText('Title if employee of an organization', 'ATP');
      safeSetText('Date_2', sessionData.date);

      if (form) {
        try { form.flatten(); } catch (e) {}
      }

    } else if (templateDef.id === 'medical_mutual') {
      // ========================================================
      // 6. Medical Mutual Rep Form (Designation for Appeals & Info)
      // ========================================================
      // Page 1: Member & Representative info - ONLY AcroForm, NO manual drawText
      const nameParts = this.splitName(sessionData.patientName);
      safeSetText('First Name', nameParts.first);
      safeSetText('Last Name', nameParts.last);

      safeSetText('Name', `Stride Mobility Group LLC / ${atpName}`);
      safeSetText('Relationship', 'Mobility Supplier / ATP');
      safeSetText('Address2', '2455 Sawmill Parkway, Huron, OH 44839');
      safeSetText('Phone Number2', '419-616-6017');
      safeSetText('Fax', '419-754-2692');
      safeSetText('Provider', 'Stride Mobility Group LLC');
      // Note: Do NOT set field 'Other' with safeSetText, as 'Other' has a second widget on Page 2 which is a large multi-line box.
      // Instead, draw "Wheelchair & Repairs" only in the Page 1 box.
      firstPage.drawText('Wheelchair & Repairs', {
        x: 450,
        y: 194,
        size: 9,
        font: helveticaFont,
        color: rgb(0.1, 0.1, 0.15)
      });

      // Page 2: Appointment checkboxes
      safeCheck('Check Box4'); // All levels of internal appeal and external review

      // Page 3: Rights & Signatures - ONLY AcroForm, NO manual drawText
      if (thirdPage) {
        if (sigImage) {
          this.drawSignatureProportional(thirdPage, sigImage, 75, 345, 250, 22);
        }
        safeSetText('Date2_es_:date', sessionData.date);
        safeSetText('Printed Name', sessionData.patientName);
        safeSetText('Authorized Representative Printed Name', atpName);
        safeSetText('Date3_es_:date', sessionData.date);
      }

      if (form) {
        try { form.flatten(); } catch (e) {}
      }

    } else {
      // ========================================================
      // 7. ABN Documents (K0862, K0861, K0863, K0005, E1161)
      // ========================================================
      try {
        if (!form) form = pdfDoc.getForm();
        
        // 1. Fill Patient Name
        try {
          const pField = form.getTextField(templateDef.pdfMapping.patientFieldName || 'PatientName');
          if (pField) pField.setText(sessionData.patientName || '');
        } catch (e) {}

        // 2. Fill Payor Name
        try {
          const payorField = form.getTextField(templateDef.pdfMapping.payorFieldName || 'PayorName');
          if (payorField) {
            payorField.setText(sessionData.payorName || 'United Medicare');
          }
        } catch (e) {}

        // 3. Fill Date
        try {
          const dateField = form.getTextField(templateDef.pdfMapping.dateFieldName || 'Date mmddyyyy');
          if (dateField) {
            dateField.setText(sessionData.date || '');
          }
        } catch (e) {}

        // 4. Explicitly populate Table Fields before flatten so they NEVER disappear!
        try {
          const itemField = form.getTextField('Item test service or careRow1');
          if (itemField) itemField.setText(templateDef.itemDesc || '');
        } catch (e) {}

        try {
          const reasonField = form.getTextField('Reason Medicare may not payRow1');
          if (reasonField) {
            reasonField.setText(templateDef.reason || 'Not a covered benefit.  Beneficiary lives in a long term care facility.');
          }
        } catch (e) {}

        try {
          const costField = form.getTextField('Estimated costRow1');
          if (costField) costField.setText(templateDef.cost || '');
        } catch (e) {}

        // Stamp Signature Image proportionally onto signature box
        if (sigImage) {
          const sCoords = templateDef.pdfMapping.signatureCoords || { x: 45, y: 116, width: 230, height: 26 };
          this.drawSignatureProportional(firstPage, sigImage, sCoords.x, sCoords.y, sCoords.width, sCoords.height);
        }

        // Print signer identity if representative
        if (sessionData.signerType === 'representative' && sessionData.repName) {
          firstPage.drawText(`Signed by POA/Rep: ${sessionData.repName} (${sessionData.repAuthority || 'Legal Rep'})`, {
            x: 45,
            y: 98,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.3)
          });
        }

        // Flatten form so fields become permanent static legal vector text
        form.flatten();
      } catch (err) {
        console.warn('Form fill warning:', err);
      }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  /**
   * Generates all selected documents and creates a single merged package PDF
   */
  async generateAllSelected(selectedTemplateIds, sessionData, signaturePngDataUrl) {
    const { PDFDocument } = this.pdfLib;
    const cleanPatient = (sessionData.patientName || 'Patient').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanDate = (sessionData.date || '').replace(/\//g, '-');

    const generatedDocs = [];
    const mergedPdf = await PDFDocument.create();

    for (const tid of selectedTemplateIds) {
      const def = window.STRIDE_TEMPLATES.find(t => t.id === tid);
      if (!def) continue;

      const pdfBytes = await this.generateDocument(def, sessionData, signaturePngDataUrl);
      
      // Determine clean filename for Brightree upload
      let docName = 'Document';
      if (def.id === 'release_repairs') docName = 'Release_Form_Repairs';
      else if (def.id === 'caresource_marketplace') docName = 'CareSource_Marketplace_Rep_Form';
      else if (def.id === 'caresource_medicaid') docName = 'CareSource_Medicaid_Rep_Form';
      else if (def.id === 'caresource_mycare') docName = 'CareSource_MyCare_Rep_Form';
      else if (def.id === 'rep_medicaid') docName = 'Medicaid_Rep_Form';
      else if (def.id === 'medical_mutual') docName = 'Medical_Mutual_Rep_Form';
      else if (def.itemCode) docName = `ABN_${def.itemCode}`;
      else docName = `ABN_${def.id}`;

      const filename = `${cleanPatient}_Stride_${docName}.pdf`;
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      generatedDocs.push({
        id: def.id,
        title: def.title,
        filename: filename,
        bytes: pdfBytes,
        blob: blob
      });

      // Merge into package
      const singleDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(singleDoc, singleDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // Save combined package PDF
    let packageDoc = null;
    if (generatedDocs.length > 0) {
      const packageBytes = await mergedPdf.save();
      const packageFilename = `${cleanPatient}_Signed_Documents_${cleanDate}.pdf`;
      const packageBlob = new Blob([packageBytes], { type: 'application/pdf' });
      packageDoc = {
        title: 'Complete Signed Documents Package',
        filename: packageFilename,
        bytes: packageBytes,
        blob: packageBlob,
        pageCount: mergedPdf.getPageCount()
      };
    }

    return {
      individualDocs: generatedDocs,
      packageDoc: packageDoc
    };
  }
}

window.StridePdfGenerator = StridePdfGenerator;
