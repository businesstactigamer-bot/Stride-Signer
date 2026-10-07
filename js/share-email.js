/**
 * Stride Mobility - Mobile Email, Share Sheet, Server Sync & Download Handlers
 * Integrates Web Share API, Native Mail Drafts, Server Auto-Save, and Brightree Package Exports.
 */

class StrideShareManager {
  constructor() {
    this.hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  }

  /**
   * Triggers download of a Blob as a file
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  }

  /**
   * Helper to convert Blob to base64 string
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        const b64 = dataUrl.split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Attempts to auto-sync the generated PDF directly to the laptop Brightree folder via server API
   */
  async saveToServer(filename, blob) {
    try {
      const pdfBase64 = await this.blobToBase64(blob);
      const res = await fetch('/api/save-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, pdfBase64 })
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[Stride Sync] Successfully saved to server Brightree folder:', data);
        return true;
      }
    } catch (e) {
      console.log('[Stride Sync] Running offline or standalone (server sync skipped):', e.message);
    }
    return false;
  }

  /**
   * Attempts to share files via native mobile share sheet (iOS Mail, Android Gmail, AirDrop, etc.)
   */
  async shareFiles(files, shareData) {
    if (!this.hasNativeShare) {
      throw new Error('Web Share API is not supported in this browser.');
    }

    // Convert blobs to File objects if needed
    const fileObjects = files.map(f => {
      if (f instanceof File) return f;
      return new File([f.blob || f], f.filename || 'document.pdf', {
        type: 'application/pdf',
        lastModified: Date.now()
      });
    });

    if (navigator.canShare && !navigator.canShare({ files: fileObjects })) {
      throw new Error('This browser cannot share PDF files directly via the system share sheet.');
    }

    await navigator.share({
      title: shareData.title || 'Signed Stride Mobility Documents',
      text: shareData.text || 'Attached are the signed documents for Brightree upload.',
      files: fileObjects
    });
  }

  /**
   * Generates a mailto: draft link for email clients
   */
  createMailtoUrl(recipientEmail, patientName, date, docTitles, filename = '', ccEmail = '') {
    const subject = encodeURIComponent(`Signed Stride Mobility Documents - ${patientName} (${date})`);
    
    let body = `Hello,\n\n`;
    if (filename) {
      body += `📎 [ATTACHMENT NOTICE]: Please attach '${filename}' from your phone's Downloads/Files folder before sending.\n\n`;
    }
    body += `Completed and signed Stride Mobility documents for patient ${patientName}.\n\n`;
    body += `PATIENT DETAILS:\n`;
    body += `- Patient Name: ${patientName}\n`;
    body += `- Date Signed: ${date}\n\n`;
    body += `DOCUMENTS COMPLETED:\n`;
    docTitles.forEach((t, i) => {
      body += `${i + 1}. ${t}\n`;
    });
    body += `\nSTATUS: Ready for Brightree Intake & Chart Upload.\n\n`;
    body += `Generated via Stride Sign Mobile ATP App.`;

    const encodedBody = encodeURIComponent(body);
    let mailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${subject}&body=${encodedBody}`;
    if (ccEmail) {
      mailto += `&cc=${encodeURIComponent(ccEmail)}`;
    }
    return mailto;
  }
}

window.StrideShareManager = StrideShareManager;
