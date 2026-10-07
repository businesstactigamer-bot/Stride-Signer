# Stride Sign - ATP Field Deployment Guide

This guide details how to export and deploy the **Stride Sign Mobile ATP App** so that all Stride Mobility Assistive Technology Professionals (ATPs) can use it in the field across Ohio.

---

## Architecture Overview
- **100% Client-Side Engine**: All PDF templates (`roi_template.pdf`, wheelchair ABNs, `caresource_rep.pdf`, `stride_rep.pdf`) and high-resolution patient review previews are base64-embedded directly in the code.
- **Offline PWA (Progressive Web App)**: Once opened once on an iPhone, iPad, Android phone, or laptop, the service worker caches 100% of the application. It works in basements, rural nursing homes, and areas with zero cell signal.
- **Personalized Routing**: Each ATP sets their own name and delivery email once in the app settings (stored locally on their device). All signed packages are routed directly to them and the Stride intake team for Brightree upload.

---

## Deployment Option 1: Free Cloud HTTPS Hosting (Recommended)
Hosting the app on an HTTPS web address allows ATPs to install it directly onto their phone's home screen as an official app icon with full offline support.

### Method A: Cloudflare Pages (Fastest & Free)
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com/) and create a free account.
2. Select **"Upload Assets"**.
3. Unzip `stride-sign-field-package.zip` and drag-and-drop the folder into Cloudflare Pages.
4. Click **Deploy**.
5. You instantly get a live HTTPS address (e.g. `https://stride-sign.pages.dev`).
6. *(Optional)* Add a custom domain like `https://sign.stridemobility.com` in one click with free automatic SSL.

### Method B: GitHub Pages (Free)
1. Push the code repository to a GitHub repo (e.g. `github.com/stridemobility/stride-sign`).
2. In GitHub, go to **Settings -> Pages**.
3. Under **Branch**, select `main` and root `/` folder, then click **Save**.
4. Your app is live at `https://<org>.github.io/stride-sign/`.

### Method C: Netlify / Vercel (Free)
1. Go to [netlify.com](https://netlify.com) or [vercel.com](https://vercel.com).
2. Drag and drop the unzipped folder.
3. Live URL generated instantly.

---

## How Field ATPs Install the App on Their Phones

Once deployed to your chosen URL (e.g. `https://sign.stridemobility.com`):

### On iPhone / iPad (Apple Safari):
1. Open the URL in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing up at the bottom).
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm by tapping **"Add"**.
5. The **Stride Sign** icon with the Stride Mobility logo will appear on the phone's home screen like any native App Store app.
6. **Tap the icon to launch**: It opens in fullscreen without browser bars, works 100% offline, and remembers their ATP profile.

### On Android Phones (Google Chrome / Brave / Edge):
1. Open the URL in **Chrome**.
2. Tap the **Three Dots Menu (⋮)** in the top-right corner.
3. Tap **"Install App"** (or **"Add to Home Screen"**).
4. Tap **"Install"**.
5. The **Stride Sign** app is installed directly into their app drawer and home screen.

---

## Deployment Option 2: Stride Mobility Windows Office Server / Network Share
If Stride Mobility maintains a local office server or laptop where you want all field signatures to automatically sync to a central Brightree folder:

1. Copy the project folder to the server.
2. Run `server.py` as a background service:
   ```cmd
   python server.py
   ```
3. Any device on the office network or VPN pointing to `http://<server-ip>:8080` will automatically sync signed PDFs to the `brightree_incoming/` folder upon signing.

---

## Deployment Option 3: Offline USB / ZIP Distribution for Laptops
If ATPs carry Windows laptops or Surface tablets in the field:
1. Distribute the included file:
   `stride-sign-field-package.zip`
2. Extract the ZIP to `C:\StrideSign` or Desktop.
3. Double-click **`Start_Stride_Sign.bat`**.
4. The local server starts and opens the browser automatically with full local saving to `brightree_incoming/`.

---

## 🛡️ Offline-First Architecture & Expired Link Immunity (v9 Engine)

### Why Temporary Links Previously Failed:
- If a temporary forwarding tunnel (like free ngrok, trial shares, or expiring links) expires, browsers typically attempt to fetch the original web address. When the link returns a "404 Not Found" or "Tunnel Expired" error, ordinary web apps break or overwrite their cache with the error screen.
- Furthermore, if a user taps **"Add to Home Screen"** before large embedded template modules finish downloading, the cache was left incomplete.

### How the Upgraded v9 Service Worker Solves This:
1. **Cache-First Navigation**: Whenever an ATP taps the Stride Sign icon on their home screen, the Service Worker loads the HTML, CSS, JS, and all 8 PDF templates directly from the phone's internal storage in milliseconds. It does **not** wait for a network response and ignores expired link errors.
2. **Expired Link Immunity**: The Service Worker will never overwrite cached code with server error pages (404, 502, or "link expired" splash screens).
3. **Resilient Asset Caching**: Uses `Promise.allSettled` to download all 15 core modules independently, ensuring no single network hiccup halts offline installation.
4. **Visual "Offline Ready" Indicator**: In the top-right header, a green **`🟢 Offline Ready`** badge confirms the phone has 100% of files stored.
5. **In-App Device Verification Button**: In the **ATP Profile Settings (⚙️)**, tap **"📥 Verify & Re-save to Device Storage"** anytime to confirm that all 15 modules are safely stored in device hardware memory.
