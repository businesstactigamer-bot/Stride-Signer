# Stride Sign - Mobile ATP Patient Signature App

A mobile-first HTML/JS web application designed specifically for **Stride Mobility** Assistive Technology Professionals (ATPs) to capture patient signatures on the fly in the field, stamp official intake documents, and email/share signed PDFs ready for **Brightree** upload.

---

## ⚡ Field Workflow

1. **Open App on Phone**:
   - Open via Safari (iPhone) or Chrome (Android).
   - Tap **"Add to Home Screen"** to use it as a full-screen mobile app!
2. **Set ATP Email Once**:
   - The app remembers your email address in `localStorage`. Every document package generated will be addressed to your inbox automatically.
3. **Type Patient Name & Info**:
   - Enter the patient's full name. Date defaults to today automatically.
   - If a family member or Power of Attorney is signing, toggle **POA / Rep** to capture their name and legal authority.
4. **Select Documents Needed (Checkbox System)**:
   - Multi-select any combination with 1 tap:
     - 📄 **Medical Release Form (ROI)**
     - ⚡ **ABN - K0862 HD Power Wheelchair** ($20,000 Est.)
     - ⚡ **ABN - K0861 Power Wheelchair** ($20,000 Est.)
     - ⚡ **ABN - K0863 Ultra-HD Power Wheelchair** ($20,000 Est.)
     - 🦽 **ABN - K0005 Ultralight Manual Wheelchair** ($10,000 Est.)
     - ♿ **ABN - E1161 Tilt-In-Space Wheelchair** ($15,000 Est.)
     - 📋 **CareSource Rep Form** (Consent to File Appeal)
     - ⚖️ **Stride Rep Form** (CMS-1696 Appointment of Representative)
5. **Grab Patient Signature**:
   - Smooth, high-DPI signature pad with touch and stylus support.
   - Tap **📱 Fullscreen** to rotate into landscape mode for a giant signing area!
   - Supports **↩️ Undo** and **🔄 Clear**.
6. **Email & Save for Brightree**:
   - Tap **✉️ Email / Share Docs**:
     - **On Phone**: Opens the native iOS/Android share drawer (Mail, Gmail, Outlook) with the signed PDF package pre-attached and subject line pre-filled!
     - **On Laptop**: Automatically downloads the Brightree package and opens an email draft in your default email client.
   - Tap **📥 Save PDF**: Downloads a merged multi-page PDF package named `{Patient_Name}_Signed_Documents_{Date}.pdf`.
   - Tap **🔄 Next Patient**: Instantly resets the patient name and signature for the next appointment while keeping your ATP email saved.

---

## 🚀 How to Share with Other ATPs

### Option 1: Over Wi-Fi / Phone Hotspot (Instant)
Run the included python server on your laptop or vehicle hotspot:
```bash
python server.py
```
The terminal will display your local network address:
```
http://192.168.1.X:8080
```
Any ATP or patient on the same Wi-Fi or mobile hotspot can open that link on their phone!

### Option 2: Host on Web / Intranet (GitHub Pages / Netlify / Vercel)
Because the app is 100% client-side with all PDF templates embedded in base64, you can drop the folder onto GitHub Pages, Netlify, or your company intranet. ATPs can bookmark the URL on their phones anywhere.

### Option 3: Standalone Offline File
ATPs can simply open `index.html` in their mobile or tablet browser. All 5 PDF templates and the Stride Mobility logo are self-contained.

---

## 📁 File Structure

```
stride-signature-app/
├── index.html              # Mobile application shell
├── server.py               # Lightweight local network server (Wi-Fi/Hotspot)
├── css/
│   ├── app.css             # Stride Mobility design system & responsive layout
│   └── signature.css       # Signature canvas, landscape modal & touch styles
├── js/
│   ├── app.js              # Application state, validation & workflow
│   ├── signature.js        # Smooth touch signature pad with bezier curves
│   ├── pdf-generator.js    # In-browser PDF stamping engine (pdf-lib)
│   ├── templates.js        # Template metadata & field coordinate mappings
│   ├── embedded-templates.js # Embedded base64 cache of all 5 templates + logo
│   ├── share-email.js      # Native mobile share & email integration
│   └── vendor/
│       └── pdf-lib.min.js  # Vendored PDFLib library (zero external CDN dependency)
└── assets/
    ├── logo.png            # Official Stride Mobility logo
    ├── manifest.json       # PWA manifest for Add to Home Screen
    └── templates/          # Original PDF template files
        ├── roi_template.pdf
        ├── abn_k0862.pdf
        ├── abn_k0861.pdf
        ├── abn_k0863.pdf
        └── abn_k0005.pdf
```
