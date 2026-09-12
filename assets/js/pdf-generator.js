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
    const pdfDoc = await PDFDocument.load(templateBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Embed patient signature PNG
    let sigImage = null;
    if (signaturePngDataUrl) {
      sigImage = await pdfDoc.embedPng(signaturePngDataUrl);
    }

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    if (templateDef.id === 'roi') {
      // ==========================================
      // 1. ROI Template Stamping (Medical Release)
      // ==========================================
      const map = templateDef.pdfMapping;
      
      // Patient Name (Bold Uppercase)
      if (sessionData.patientName) {
        firstPage.drawText(sessionData.patientName.toUpperCase(), {
          x: map.patientName.x,
          y: map.patientName.y,
          size: map.patientName.size,
          font: helveticaBold,
          color: rgb(0.05, 0.05, 0.1)
        });
      }

      // Releasing Organization (PCP or Ohio Vendor entered by ATP, e.g. NPL Home Medical)
      const releasing = (sessionData.releasingOrg && sessionData.releasingOrg.trim()) || 'Primary Care Physician / Medical Records';
      firstPage.drawText(releasing, {
        x: map.releasingOrg.x,
        y: map.releasingOrg.y,
        size: map.releasingOrg.size,
        font: helveticaFont,
        color: rgb(0.05, 0.05, 0.1)
      });

      // Expiration Date: Calculated exactly 1 year from signature date into MM/DD/YYYY slots
      let expMm = '09', expDd = '12', expYyyy = '2027';
      if (sessionData.date) {
        const dParts = sessionData.date.split('/');
        if (dParts.length === 3) {
          expMm = dParts[0].padStart(2, '0');
          expDd = dParts[1].padStart(2, '0');
          const curY = parseInt(dParts[2], 10);
          expYyyy = String(isNaN(curY) ? 2027 : (curY < 100 ? curY + 2001 : curY + 1));
        }
      }
      // Template has: 'This authorization expires on _____/_____/____'
      // Slot coordinates:
      firstPage.drawText(expMm, { x: 208, y: 299, size: 10, font: helveticaBold, color: rgb(0.05, 0.05, 0.1) });
      firstPage.drawText(expDd, { x: 234, y: 299, size: 10, font: helveticaBold, color: rgb(0.05, 0.05, 0.1) });
      firstPage.drawText(expYyyy, { x: 260, y: 299, size: 10, font: helveticaBold, color: rgb(0.05, 0.05, 0.1) });

      // Patient / Rep Signature (Proportionally scaled to sit cleanly on baseline y=125)
      if (sigImage) {
        this.drawSignatureProportional(firstPage, sigImage, 80, 125, 220, 28);
      }

      // Date: Place MM, DD, YYYY directly into 'Date _____/_____/________' slots
      if (sessionData.date) {
        const dParts = sessionData.date.split('/');
        if (dParts.length === 3) {
          const dtMm = dParts[0].padStart(2, '0');
          const dtDd = dParts[1].padStart(2, '0');
          const dtYyyy = dParts[2].length === 2 ? `20${dParts[2]}` : dParts[2];
          
          firstPage.drawText(dtMm, { x: 451, y: 135, size: 10, font: helveticaBold, color: rgb(0.05, 0.05, 0.1) });
          firstPage.drawText(dtDd, { x: 475, y: 135, size: 10, font: helveticaBold, color: rgb(0.05, 0.05, 0.1) });
          firstPage.drawText(dtYyyy, { x: 499, y: 135, size: 10, font: helveticaBold, color: rgb(0.05, 0.05, 0.1) });
        } else {
          firstPage.drawText(sessionData.date, {
            x: 450,
            y: 135,
            size: 10,
            font: helveticaBold,
            color: rgb(0.05, 0.05, 0.1)
          });
        }
      }

      // Printed Name
      const printedName = sessionData.signerType === 'representative' && sessionData.repName
        ? `${sessionData.repName} (Rep for ${sessionData.patientName})`
        : sessionData.patientName;
      
      if (printedName) {
        firstPage.drawText(printedName, {
          x: map.printedName.x,
          y: map.printedName.y,
          size: map.printedName.size,
          font: helveticaBold,
          color: rgb(0.05, 0.05, 0.1)
        });
      }

      // Representative Authority
      if (sessionData.signerType === 'representative' && sessionData.repAuthority) {
        firstPage.drawText(sessionData.repAuthority, {
          x: map.repAuthority.x,
          y: map.repAuthority.y,
          size: map.repAuthority.size,
          font: helveticaFont,
          color: rgb(0.1, 0.1, 0.15)
        });
      }
    } else if (templateDef.id === 'caresource_rep') {
      // ========================================================
      // 2. CareSource Rep Form (Consent for Provider to Appeal)
      // ========================================================
      const map = templateDef.pdfMapping;

      // Member Name
      if (sessionData.patientName) {
        firstPage.drawText(sessionData.patientName, {
          x: map.patientName.x,
          y: map.patientName.y,
          size: map.patientName.size,
          font: helveticaBold,
          color: rgb(0.05, 0.05, 0.1)
        });
      }

      // Member Signature & Date
      if (sessionData.signerType === 'patient') {
        if (sigImage) {
          this.drawSignatureProportional(firstPage, sigImage, map.signature.x, map.signature.y, map.signature.width, map.signature.height);
        }
        if (sessionData.date) {
          firstPage.drawText(sessionData.date, {
            x: map.date.x,
            y: map.date.y,
            size: map.date.size,
            font: helveticaBold,
            color: rgb(0.05, 0.05, 0.1)
          });
        }
      } else {
        // Representative section
        if (sessionData.repName) {
          firstPage.drawText(sessionData.repName, {
            x: map.repName.x,
            y: map.repName.y,
            size: map.repName.size,
            font: helveticaBold,
            color: rgb(0.05, 0.05, 0.1)
          });
        }
        const rel = sessionData.repAuthority || 'Power of Attorney';
        firstPage.drawText(rel, {
          x: map.repRelationship.x,
          y: map.repRelationship.y,
          size: map.repRelationship.size,
          font: helveticaFont,
          color: rgb(0.05, 0.05, 0.1)
        });
        if (sigImage) {
          this.drawSignatureProportional(firstPage, sigImage, map.repSignature.x, map.repSignature.y, map.repSignature.width, map.repSignature.height);
        }
        if (sessionData.date) {
          firstPage.drawText(sessionData.date, {
            x: map.repDate.x,
            y: map.repDate.y,
            size: map.repDate.size,
            font: helveticaBold,
            color: rgb(0.05, 0.05, 0.1)
          });
        }
      }
    } else if (templateDef.id === 'stride_rep') {
      // ========================================================
      // 3. Stride Rep Form (CMS-1696 Appointment of Representative)
      // ========================================================
      const map = templateDef.pdfMapping;

      // Section 1: Name of Party (Patient) - Enlarged and bold (13pt)
      if (sessionData.patientName) {
        firstPage.drawText(sessionData.patientName, {
          x: map.patientName.x,
          y: map.patientName.y,
          size: map.patientName.size || 13,
          font: helveticaBold,
          color: rgb(0.05, 0.05, 0.1)
        });
      }

      // Appoint individual (ATP Name only)
      const appointedText = (sessionData.atpName && sessionData.atpName.trim()) 
        ? sessionData.atpName.trim() 
        : 'Tim Sanders, ATP';
      firstPage.drawText(appointedText, {
        x: map.appointedRep.x,
        y: map.appointedRep.y,
        size: map.appointedRep.size,
        font: helveticaBold,
        color: rgb(0.05, 0.05, 0.1)
      });

      // Signature of Party Seeking Representation (Proportionally scaled to fit shorter line)
      if (sigImage) {
        this.drawSignatureProportional(firstPage, sigImage, map.signature.x, map.signature.y, map.signature.width, map.signature.height);
      }

      // Date (Raised slightly higher)
      if (sessionData.date) {
        firstPage.drawText(sessionData.date, {
          x: map.date.x,
          y: map.date.y,
          size: map.date.size || 10.5,
          font: helveticaBold,
          color: rgb(0.05, 0.05, 0.1)
        });
      }
    } else {
      // ========================================================
      // 4. ABN Documents (K0862, K0861, K0863, K0005, E1161)
      // ========================================================
      try {
        const form = pdfDoc.getForm();
        
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
      if (def.id === 'roi') docName = 'Medical_Release_ROI';
      else if (def.id === 'caresource_rep') docName = 'CareSource_Rep_Form';
      else if (def.id === 'stride_rep') docName = 'Stride_CMS1696_Rep_Form';
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
      const singleDoc = await PDFDocument.load(pdfBytes);
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
