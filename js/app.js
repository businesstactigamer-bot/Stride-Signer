/**
 * Stride Mobility - Mobile ATP Signature Web App Controller
 * Streamlined, single-screen checkbox-based intake & document signing engine.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    atp: {
      name: '',
      email: '',
      ccEmail: ''
    },
    selectedDocs: new Set(['release_repairs']), // Default: Release Form Repairs checked
    patientName: '',
    date: getTodayFormatted(),
    signerType: 'patient', // 'patient' | 'representative'
    repName: '',
    repAuthority: 'Power of Attorney (POA)',
    releasingOrg: '',
    roiExpiration: '1 Year from Date of Signature',
    payorName: 'United Medicare',
    generatedResult: null
  };

  // Helper: Today's date MM/DD/YYYY
  function getTodayFormatted() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // DOM Elements
  const atpDisplayEmail = document.getElementById('atpDisplayEmail');
  const atpEditBtn = document.getElementById('atpEditBtn');
  const atpModal = document.getElementById('atpModal');
  const atpNameInput = document.getElementById('atpNameInput');
  const atpEmailInput = document.getElementById('atpEmailInput');
  const atpCcInput = document.getElementById('atpCcInput');
  const saveAtpBtn = document.getElementById('saveAtpBtn');
  const closeAtpModalBtn = document.getElementById('closeAtpModalBtn');

  // Patient inputs
  const patientNameInput = document.getElementById('patientNameInput');
  const dateInput = document.getElementById('dateInput');
  const releasingOrgInput = document.getElementById('releasingOrgInput');
  const signerTypeRepToggle = document.getElementById('signerTypeRepToggle');
  const repFieldsGroup = document.getElementById('repFieldsGroup');
  const repNameInput = document.getElementById('repNameInput');
  const repAuthorityInput = document.getElementById('repAuthorityInput');
  const sigLabel = document.getElementById('sigLabel');

  // Document checkboxes
  const docCheckboxesContainer = document.getElementById('docCheckboxesContainer');
  const docSelectedCountBadge = document.getElementById('docSelectedCountBadge');

  // Signature elements
  const canvas = document.getElementById('signatureCanvas');
  const undoSigBtn = document.getElementById('undoSigBtn');
  const clearSigBtn = document.getElementById('clearSigBtn');
  const openFullscreenSigBtn = document.getElementById('openFullscreenSigBtn');

  // Fullscreen signature modal
  const fsSigModal = document.getElementById('fsSigModal');
  const fsCanvas = document.getElementById('fsCanvas');
  const fsUndoBtn = document.getElementById('fsUndoBtn');
  const fsClearBtn = document.getElementById('fsClearBtn');
  const fsDoneBtn = document.getElementById('fsDoneBtn');
  const fsHeaderApproveBtn = document.getElementById('fsHeaderApproveBtn');
  const fsApproveExportBtn = document.getElementById('fsApproveExportBtn');
  const fsCancelBtn = document.getElementById('fsCancelBtn');

  // Bottom action buttons
  const shareBtn = document.getElementById('shareBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const viewPdfBtn = document.getElementById('viewPdfBtn');
  const newPatientBtn = document.getElementById('newPatientBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  // Document Preview Modal (Show Documents to Patient)
  const previewDocsBtn = document.getElementById('previewDocsBtn');
  const docPreviewModal = document.getElementById('docPreviewModal');
  const previewDocTitle = document.getElementById('previewDocTitle');
  const previewPatientChip = document.getElementById('previewPatientChip');
  const docTabsBar = document.getElementById('docTabsBar');
  const docPageBar = document.getElementById('docPageBar');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageIndicator = document.getElementById('pageIndicator');
  const previewDocImg = document.getElementById('previewDocImg');
  const prevDocBtn = document.getElementById('prevDocBtn');
  const nextDocBtn = document.getElementById('nextDocBtn');
  const donePreviewBtn = document.getElementById('donePreviewBtn');
  const closeDocPreviewBtn = document.getElementById('closeDocPreviewBtn');
  const docViewport = document.getElementById('docViewport');

  let reviewDocsList = [];
  let currentDocIdx = 0;
  let currentPageIdx = 0;

  // Attachment instructions modal
  const attachmentModal = document.getElementById('attachmentModal');
  const downloadedFilenameTag = document.getElementById('downloadedFilenameTag');
  const openMailDraftBtn = document.getElementById('openMailDraftBtn');
  const closeAttachmentModalBtn = document.getElementById('closeAttachmentModalBtn');
  const serverSyncStatus = document.getElementById('serverSyncStatus');

  // PDF Preview modal
  const pdfViewModal = document.getElementById('pdfViewModal');
  const pdfViewFrame = document.getElementById('pdfViewFrame');

  // Offline Indicator & Hardware Storage elements
  const offlinePill = document.getElementById('offlinePill');
  const offlineText = document.getElementById('offlineText');
  const verifyOfflineBtn = document.getElementById('verifyOfflineBtn');
  const settingsOfflineBadge = document.getElementById('settingsOfflineBadge');

  // Initialize Engines
  const SignatureEngine = window.StrideSignaturePad || window.SignaturePad;
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const initialPen = isDark ? '#ffffff' : '#0a0f18';
  const sigPad = new SignatureEngine(canvas, { penColor: initialPen });
  const fsSigPad = new SignatureEngine(fsCanvas, { penColor: initialPen });
  const pdfGenerator = new StridePdfGenerator();
  const shareManager = new StrideShareManager();

  // Set default date
  dateInput.value = state.date;

  // 1. Load Stored ATP Profile
  function loadAtpProfile() {
    try {
      const stored = localStorage.getItem('stride_atp_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        state.atp = Object.assign(state.atp, parsed);
        atpNameInput.value = state.atp.name || '';
        atpEmailInput.value = state.atp.email || '';
        atpCcInput.value = state.atp.ccEmail || '';
        atpDisplayEmail.textContent = state.atp.email || 'Set Email';
      } else {
        atpDisplayEmail.textContent = 'Set Email';
      }
    } catch (e) {
      console.warn('Could not read ATP profile from localStorage:', e);
    }
  }

  function saveAtpProfile() {
    const email = atpEmailInput.value.trim();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid ATP email address', 'error');
      return;
    }
    state.atp.name = atpNameInput.value.trim();
    state.atp.email = email;
    state.atp.ccEmail = atpCcInput.value.trim();

    try {
      localStorage.setItem('stride_atp_profile', JSON.stringify(state.atp));
      atpDisplayEmail.textContent = state.atp.email;
      closeModal(atpModal);
      showToast('ATP profile saved! Email remembered on this phone.', 'success');
    } catch (e) {
      showToast('Could not save profile to phone storage', 'error');
    }
  }

  atpEditBtn.addEventListener('click', () => openModal(atpModal));
  closeAtpModalBtn.addEventListener('click', () => closeModal(atpModal));
  saveAtpBtn.addEventListener('click', saveAtpProfile);

  // 2. Render Document Checkboxes
  function renderDocCheckboxes() {
    docCheckboxesContainer.innerHTML = '';
    
    window.STRIDE_TEMPLATES.forEach((doc) => {
      const isChecked = state.selectedDocs.has(doc.id);
      
      const item = document.createElement('label');
      item.className = `doc-checkbox-item ${isChecked ? 'checked' : ''}`;
      
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.value = doc.id;
      chk.checked = isChecked;

      chk.addEventListener('change', (e) => {
        if (e.target.checked) {
          state.selectedDocs.add(doc.id);
          item.classList.add('checked');
        } else {
          state.selectedDocs.delete(doc.id);
          item.classList.remove('checked');
        }
        state.generatedResult = null; // Invalidate cache
        updateSelectedCount();
      });

      const info = document.createElement('div');
      info.className = 'doc-checkbox-info';

      const title = document.createElement('span');
      title.className = 'doc-checkbox-title';
      title.textContent = doc.shortTitle || doc.title;

      const badge = document.createElement('span');
      badge.className = 'doc-checkbox-badge';
      badge.textContent = doc.badge ? `${doc.icon || '📄'} ${doc.badge}` : (doc.icon || '📄');

      info.appendChild(title);
      info.appendChild(badge);

      const rowPreviewBtn = document.createElement('button');
      rowPreviewBtn.type = 'button';
      rowPreviewBtn.className = 'doc-row-preview-btn';
      rowPreviewBtn.title = `Preview ${doc.shortTitle || doc.title}`;
      rowPreviewBtn.innerHTML = '👁️';
      rowPreviewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openDocPreview([doc.id]);
      });

      item.appendChild(chk);
      item.appendChild(info);
      item.appendChild(rowPreviewBtn);

      docCheckboxesContainer.appendChild(item);
    });

    updateSelectedCount();
  }

  function updateSelectedCount() {
    const count = state.selectedDocs.size;
    docSelectedCountBadge.textContent = `${count} Selected`;
    if (previewDocsBtn) {
      if (count === 0) {
        previewDocsBtn.textContent = '👁️ Preview Document';
        previewDocsBtn.style.opacity = '0.5';
      } else if (count === 1) {
        previewDocsBtn.textContent = '👁️ Preview Document';
        previewDocsBtn.style.opacity = '1';
      } else {
        previewDocsBtn.textContent = `👁️ Preview (${count})`;
        previewDocsBtn.style.opacity = '1';
      }
    }
    if (count === 0) {
      docSelectedCountBadge.style.background = 'rgba(239, 68, 68, 0.15)';
      docSelectedCountBadge.style.color = '#ef4444';
    } else {
      docSelectedCountBadge.style.background = 'rgba(229, 37, 52, 0.15)';
      docSelectedCountBadge.style.color = 'var(--stride-red)';
    }
  }

  // 2b. Patient Document Reviewer Engine
  if (previewDocsBtn) {
    previewDocsBtn.addEventListener('click', () => {
      const selected = Array.from(state.selectedDocs);
      if (selected.length === 0) {
        showToast('Please check at least one document to preview', 'info');
        return;
      }
      openDocPreview(selected);
    });
  }

  function openDocPreview(docIds, initialIndex = 0) {
    reviewDocsList = docIds.map(id => window.STRIDE_TEMPLATES.find(t => t.id === id)).filter(Boolean);
    if (reviewDocsList.length === 0) return;

    currentDocIdx = Math.max(0, Math.min(initialIndex, reviewDocsList.length - 1));
    currentPageIdx = 0;

    renderDocTabs();
    updateDocView();
    openModal(docPreviewModal);
  }

  function renderDocTabs() {
    docTabsBar.innerHTML = '';
    if (reviewDocsList.length <= 1) {
      docTabsBar.classList.add('hidden');
      return;
    }
    docTabsBar.classList.remove('hidden');

    reviewDocsList.forEach((doc, idx) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = `doc-tab-btn ${idx === currentDocIdx ? 'active' : ''}`;
      tab.textContent = `${doc.icon || '📄'} ${doc.shortTitle || doc.title}`;
      tab.addEventListener('click', () => {
        currentDocIdx = idx;
        currentPageIdx = 0;
        renderDocTabs();
        updateDocView();
      });
      docTabsBar.appendChild(tab);
    });
  }

  function updateDocView() {
    const doc = reviewDocsList[currentDocIdx];
    if (!doc) return;

    // Title & Patient Info
    previewDocTitle.innerHTML = `<span>${doc.icon || '📄'}</span> ${doc.title}`;
    if (state.patientName) {
      previewPatientChip.textContent = `Patient: ${state.patientName} (${state.date})`;
    } else {
      previewPatientChip.textContent = `Official Form (${state.date})`;
    }

    const pages = doc.previewPages || [];
    const totalPages = pages.length;

    // Multi-page controls (e.g. Stride Rep has 2 pages)
    if (totalPages > 1) {
      docPageBar.classList.remove('hidden');
      pageIndicator.textContent = `Page ${currentPageIdx + 1} of ${totalPages}`;
      prevPageBtn.disabled = currentPageIdx === 0;
      nextPageBtn.disabled = currentPageIdx === totalPages - 1;
      prevPageBtn.style.opacity = currentPageIdx === 0 ? '0.4' : '1';
      nextPageBtn.style.opacity = currentPageIdx === totalPages - 1 ? '0.4' : '1';
    } else {
      docPageBar.classList.add('hidden');
    }

    // Load High-Res WebP Preview
    const pageKey = pages[currentPageIdx] || `${doc.embeddedKey}_page_1`;
    let imgSrc = '';
    if (window.STRIDE_PREVIEWS_DATA && window.STRIDE_PREVIEWS_DATA[pageKey]) {
      imgSrc = window.STRIDE_PREVIEWS_DATA[pageKey];
    } else {
      imgSrc = `assets/previews/${pageKey}.webp`;
    }
    previewDocImg.src = imgSrc;
    docViewport.scrollTo({ top: 0, behavior: 'smooth' });

    // Footer Next/Prev doc buttons
    prevDocBtn.disabled = currentDocIdx === 0;
    nextDocBtn.disabled = currentDocIdx === reviewDocsList.length - 1;
    prevDocBtn.style.opacity = currentDocIdx === 0 ? '0.4' : '1';
    nextDocBtn.style.opacity = currentDocIdx === reviewDocsList.length - 1 ? '0.4' : '1';

    // Highlight active tab
    const tabs = docTabsBar.querySelectorAll('.doc-tab-btn');
    tabs.forEach((t, i) => {
      t.classList.toggle('active', i === currentDocIdx);
    });
  }

  // Page switching events
  prevPageBtn.addEventListener('click', () => {
    if (currentPageIdx > 0) {
      currentPageIdx--;
      updateDocView();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    const doc = reviewDocsList[currentDocIdx];
    if (doc && currentPageIdx < (doc.previewPages || []).length - 1) {
      currentPageIdx++;
      updateDocView();
    }
  });

  // Doc switching events
  prevDocBtn.addEventListener('click', () => {
    if (currentDocIdx > 0) {
      currentDocIdx--;
      currentPageIdx = 0;
      renderDocTabs();
      updateDocView();
    }
  });

  nextDocBtn.addEventListener('click', () => {
    if (currentDocIdx < reviewDocsList.length - 1) {
      currentDocIdx++;
      currentPageIdx = 0;
      renderDocTabs();
      updateDocView();
    }
  });

  donePreviewBtn.addEventListener('click', () => {
    closeModal(docPreviewModal);
    const sigSec = document.querySelector('.sig-section');
    if (sigSec) {
      sigSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  closeDocPreviewBtn.addEventListener('click', () => {
    closeModal(docPreviewModal);
  });

  // 3. Patient & Representative Input Handlers
  patientNameInput.addEventListener('input', (e) => {
    state.patientName = e.target.value.trim();
    state.generatedResult = null;
  });

  dateInput.addEventListener('input', (e) => {
    state.date = e.target.value.trim();
    state.generatedResult = null;
  });

  if (releasingOrgInput) {
    releasingOrgInput.addEventListener('input', (e) => {
      state.releasingOrg = e.target.value.trim();
      state.generatedResult = null;
    });
  }

  signerTypeRepToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      state.signerType = 'representative';
      repFieldsGroup.classList.remove('hidden');
      sigLabel.textContent = 'Sign Below (Representative / POA)';
    } else {
      state.signerType = 'patient';
      repFieldsGroup.classList.add('hidden');
      sigLabel.textContent = 'Sign Below (Patient)';
    }
    state.generatedResult = null;
  });

  repNameInput.addEventListener('input', (e) => {
    state.repName = e.target.value.trim();
    state.generatedResult = null;
  });

  repAuthorityInput.addEventListener('change', (e) => {
    state.repAuthority = e.target.value;
    state.generatedResult = null;
  });

  // 4. Signature Events & Landscape Fullscreen Mode
  undoSigBtn.addEventListener('click', () => {
    sigPad.undo();
    state.generatedResult = null;
  });

  clearSigBtn.addEventListener('click', () => {
    sigPad.clear();
    state.generatedResult = null;
  });

  openFullscreenSigBtn.addEventListener('click', () => {
    fsSigPad.setStrokes(sigPad.getStrokes());
    fsSigModal.classList.add('active');
    setTimeout(() => fsSigPad.resize(), 100);
  });

  function handleFsApprove(andExport = false) {
    if (fsSigPad.isEmpty()) {
      showToast('Please sign on the pad before approving', 'info');
      return;
    }
    sigPad.setStrokes(fsSigPad.getStrokes());
    fsSigModal.classList.remove('active');
    state.generatedResult = null;
    showToast('Signature approved! Ready to export.', 'success');

    // Smooth scroll down to the export action buttons
    const actionsBar = document.querySelector('.actions-bar');
    if (actionsBar) {
      actionsBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (andExport) {
      setTimeout(() => {
        shareBtn.click();
      }, 300);
    }
  }

  fsUndoBtn.addEventListener('click', () => fsSigPad.undo());
  fsClearBtn.addEventListener('click', () => fsSigPad.clear());
  if (fsHeaderApproveBtn) {
    fsHeaderApproveBtn.addEventListener('click', () => handleFsApprove(false));
  }
  if (fsDoneBtn) {
    fsDoneBtn.addEventListener('click', () => handleFsApprove(false));
  }
  if (fsApproveExportBtn) {
    fsApproveExportBtn.addEventListener('click', () => handleFsApprove(true));
  }
  fsCancelBtn.addEventListener('click', () => {
    fsSigModal.classList.remove('active');
  });

  // 5. Validation Check
  function validateForm() {
    if (!state.patientName) {
      showToast('Please enter the patient name', 'error');
      patientNameInput.focus();
      return false;
    }
    if (state.selectedDocs.size === 0) {
      showToast('Please check at least one document', 'error');
      return false;
    }
    if (sigPad.isEmpty()) {
      showToast('Please capture the patient signature before continuing', 'error');
      return false;
    }
    if (state.signerType === 'representative' && !state.repName) {
      showToast('Please enter the representative printed name', 'error');
      repNameInput.focus();
      return false;
    }
    return true;
  }

  // 6. Generate PDFs
  async function generateDocuments() {
    if (!validateForm()) return null;

    if (state.generatedResult) {
      return state.generatedResult;
    }

    showToast('Stamping official signed PDFs...', 'info');

    try {
      const signaturePng = sigPad.toDataURL();
      const selectedIds = Array.from(state.selectedDocs);

      const sessionData = {
        patientName: state.patientName,
        date: state.date,
        signerType: state.signerType,
        repName: state.repName,
        repAuthority: state.repAuthority,
        releasingOrg: state.releasingOrg,
        roiExpiration: state.roiExpiration,
        payorName: state.payorName,
        atpName: state.atp.name
      };

      const result = await pdfGenerator.generateAllSelected(selectedIds, sessionData, signaturePng);
      state.generatedResult = result;
      viewPdfBtn.classList.remove('hidden');

      // Attempt background auto-sync to laptop brightree folder if server is reachable
      shareManager.saveToServer(result.packageDoc.filename, result.packageDoc.blob).then(saved => {
        if (saved && serverSyncStatus) {
          serverSyncStatus.textContent = '📁 Synced to laptop brightree_incoming folder!';
        }
      });

      return result;
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast(`Error generating PDFs: ${err.message}`, 'error');
      return null;
    }
  }

  // 7. Email / Share Workflow
  let pendingMailtoUrl = '';

  shareBtn.addEventListener('click', async () => {
    const result = await generateDocuments();
    if (!result) return;

    const docTitles = result.individualDocs.map(d => d.title);
    const filesToShare = [result.packageDoc];

    // Attempt Native Mobile File Sharing (Works on HTTPS / iOS Safari / Secure PWA)
    let sharedViaNative = false;
    if (shareManager.hasNativeShare && navigator.canShare) {
      try {
        const fileObj = new File([result.packageDoc.blob], result.packageDoc.filename, {
          type: 'application/pdf',
          lastModified: Date.now()
        });

        if (navigator.canShare({ files: [fileObj] })) {
          await navigator.share({
            title: `Signed Documents: ${state.patientName}`,
            text: `Attached are the completed signed Stride Mobility documents for ${state.patientName} (${state.date}).`,
            files: [fileObj]
          });
          sharedViaNative = true;
          showToast('Shared successfully with attachment!', 'success');
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return; // User simply closed share sheet
        console.warn('Native share error, falling back:', err);
      }
    }

    // Fallback: Download file locally and show the clear 1-tap attachment helper modal
    shareManager.downloadBlob(result.packageDoc.blob, result.packageDoc.filename);

    pendingMailtoUrl = shareManager.createMailtoUrl(
      state.atp.email,
      state.patientName,
      state.date,
      docTitles,
      result.packageDoc.filename,
      state.atp.ccEmail
    );

    downloadedFilenameTag.textContent = result.packageDoc.filename;
    openModal(attachmentModal);
  });

  openMailDraftBtn.addEventListener('click', () => {
    closeModal(attachmentModal);
    if (pendingMailtoUrl) {
      window.location.href = pendingMailtoUrl;
    }
  });

  closeAttachmentModalBtn.addEventListener('click', () => closeModal(attachmentModal));

  // 8. Download PDF Button
  downloadBtn.addEventListener('click', async () => {
    const result = await generateDocuments();
    if (!result) return;

    shareManager.downloadBlob(result.packageDoc.blob, result.packageDoc.filename);
    showToast(`Downloaded ${result.packageDoc.filename}!`, 'success');
  });

  // 9. View Stamped PDF
  viewPdfBtn.addEventListener('click', async () => {
    const result = await generateDocuments();
    if (!result) return;

    const pdfUrl = URL.createObjectURL(result.packageDoc.blob);
    pdfViewFrame.src = pdfUrl;
    openModal(pdfViewModal);
  });

  document.getElementById('closePdfViewModalBtn').addEventListener('click', () => {
    closeModal(pdfViewModal);
  });

  // 10. Next Patient Reset
  newPatientBtn.addEventListener('click', () => {
    if (state.patientName || !sigPad.isEmpty()) {
      if (!confirm('Start new patient? Unsaved signature will be cleared.')) return;
    }

    patientNameInput.value = '';
    state.patientName = '';
    sigPad.clear();
    state.date = getTodayFormatted();
    dateInput.value = state.date;
    
    // Reset Releasing Org / Vendor
    if (releasingOrgInput) {
      releasingOrgInput.value = '';
      state.releasingOrg = '';
    }

    // Reset signer type
    signerTypeRepToggle.checked = false;
    state.signerType = 'patient';
    repFieldsGroup.classList.add('hidden');
    repNameInput.value = '';
    state.repName = '';
    sigLabel.textContent = 'Sign Below (Patient)';

    // Reset doc selection to Release Form Repairs
    state.selectedDocs = new Set(['release_repairs']);
    renderDocCheckboxes();

    viewPdfBtn.classList.add('hidden');
    state.generatedResult = null;

    showToast('Ready for next patient!', 'info');
  });

  // 11. Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    themeToggleBtn.textContent = nextTheme === 'dark' ? '🌙' : '☀️';

    const penColor = nextTheme === 'dark' ? '#ffffff' : '#0a0f18';
    sigPad.options.penColor = penColor;
    fsSigPad.options.penColor = penColor;
    sigPad.redraw();
    fsSigPad.redraw();
  });

  // Modal helpers
  function openModal(modal) { modal.classList.add('active'); }
  function closeModal(modal) { modal.classList.remove('active'); }

  // Toast Helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // Register PWA Service Worker for 100% Offline Standalone Support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[Stride Sign] Offline Service Worker active:', reg.scope);
          if (reg.installing) {
            setOfflineStatus('caching');
          } else if (reg.active) {
            setOfflineStatus('ready');
          }
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  setOfflineStatus('ready');
                }
              });
            }
          });
        })
        .catch((err) => console.warn('[Stride Sign] Service Worker error:', err));
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (!event.data) return;
      if (event.data.type === 'STRIDE_OFFLINE_READY') {
        setOfflineStatus('ready');
      } else if (event.data.type === 'CACHE_VERIFICATION_RESULT') {
        if (event.data.allReady) {
          setOfflineStatus('ready');
          if (settingsOfflineBadge) settingsOfflineBadge.textContent = '100% Saved';
          showToast(`✓ Phone Storage Verified: ${event.data.cached} assets safely stored locally!`, 'success');
        } else {
          showToast(`Stored ${event.data.cached}/${event.data.total} assets on device.`, 'info');
        }
      }
    });
  }

  function setOfflineStatus(status) {
    if (!offlinePill) return;
    if (status === 'ready') {
      offlinePill.classList.remove('caching');
      if (offlineText) offlineText.textContent = 'Offline Ready';
      if (settingsOfflineBadge) {
        settingsOfflineBadge.textContent = 'Ready (Device Storage)';
        settingsOfflineBadge.style.color = '#34d399';
      }
    } else if (status === 'caching') {
      offlinePill.classList.add('caching');
      if (offlineText) offlineText.textContent = 'Saving...';
      if (settingsOfflineBadge) {
        settingsOfflineBadge.textContent = 'Downloading...';
        settingsOfflineBadge.style.color = '#fbbf24';
      }
    }
  }

  if (offlinePill) {
    offlinePill.addEventListener('click', () => {
      showToast('📱 100% Offline Ready: All forms and signatures work with zero cell reception or even if links expire.', 'success');
    });
  }

  if (verifyOfflineBtn) {
    verifyOfflineBtn.addEventListener('click', () => {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        showToast('Verifying local phone storage cache...', 'info');
        navigator.serviceWorker.controller.postMessage({ type: 'VERIFY_CACHE' });
      } else {
        showToast('Service Worker active. App is saved in browser cache.', 'success');
      }
    });
  }

  window.addEventListener('offline', () => {
    showToast('Offline Mode: Signing & PDF generation continue working locally!', 'info');
  });

  window.addEventListener('online', () => {
    showToast('Back Online: Ready to email & share packages.', 'success');
  });

  // Initial Boot
  loadAtpProfile();
  renderDocCheckboxes();

  if (!state.atp.email && !window.location.search.includes('autotest=true')) {
    setTimeout(() => openModal(atpModal), 400);
  }

  // Diagnostic Test Mode (?autotest=true)
  if (window.location.search.includes('autotest=true')) {
    console.log('[AUTOTEST] Running automated test for single-screen checkbox workflow...');
    state.atp.email = 'tsanders@stridemobility.com';
    state.atp.name = 'Tim Sanders, ATP';
    atpDisplayEmail.textContent = state.atp.email;
    patientNameInput.value = 'Jonathon Doe';
    state.patientName = 'Jonathon Doe';
    
    if (releasingOrgInput) {
      releasingOrgInput.value = 'Buckeye Mobility & Rehab Specialists (Ohio)';
      state.releasingOrg = 'Buckeye Mobility & Rehab Specialists (Ohio)';
    }

    // Select Release Form Repairs + E1161 + CareSource Medicaid + Rep Medicaid
    state.selectedDocs = new Set(['release_repairs', 'abn_e1161', 'caresource_medicaid', 'rep_medicaid']);
    renderDocCheckboxes();

    sigPad.setStrokes([
      [{ x: 30, y: 50 }, { x: 70, y: 30 }, { x: 100, y: 60 }, { x: 150, y: 40 }],
      [{ x: 160, y: 45 }, { x: 200, y: 55 }, { x: 230, y: 40 }]
    ]);

    setTimeout(async () => {
      try {
        const result = await generateDocuments();
        if (result && result.packageDoc) {
          const testBanner = document.createElement('div');
          testBanner.id = 'autotestResult';
          testBanner.style.cssText = 'position:fixed;top:8px;left:8px;right:8px;background:#10b981;color:#fff;padding:10px;border-radius:6px;font-weight:bold;z-index:9999;text-align:center;font-size:0.85rem;';
          testBanner.textContent = `AUTOTEST PASSED: Generated ${result.individualDocs.length} documents (${result.packageDoc.pageCount} pages, ${result.packageDoc.bytes.length} bytes)`;
          document.body.appendChild(testBanner);
          window.__AUTOTEST_SUCCESS = true;
          window.__AUTOTEST_RESULT = {
            docCount: result.individualDocs.length,
            packagePages: result.packageDoc.pageCount,
            bytes: result.packageDoc.bytes.length
          };
          console.log('[AUTOTEST] PASSED:', window.__AUTOTEST_RESULT);
        }
      } catch (err) {
        console.error('[AUTOTEST] FAILED:', err);
      }
    }, 400);
  }
});
