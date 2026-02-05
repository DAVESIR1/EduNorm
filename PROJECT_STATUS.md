# EduNorm Project Status - February 5, 2026

## 🎉 SITE IS LIVE!
**URL:** https://edunorm.in / https://www.edunorm.in

---

## ✅ What's Working

| Feature | Status |
|---------|--------|
| Domain (edunorm.in) | ✅ Live via Vercel |
| Firebase Auth | ✅ Configured (needs domain whitelist) |
| Cloudflare R2 Storage | ✅ Configured |
| Mandatory Backup System | ✅ Working |
| Offline Mode | ✅ Working |
| Local IndexedDB | ✅ Working |
| General Register | ✅ Fixed - View/Edit/Maximize buttons |
| Student ID Card | ✅ Enhanced - Standard size, batch print |
| Profile Viewer | ✅ Enhanced - Paper size, print ready |

---

## 🆕 Latest Updates (Feb 5, 2026)

### ID Card & Profile Print System
- **ID Card Size:** Standard 85.6mm × 54mm (credit card size)
- **Paper Size Selector:** A4 (10 cards), Letter (10), Legal (12), A5 (3)
- **Batch Printing:** Search by GR number, multi-select students
- **Print Mode:** Only content prints, no UI elements

### General Register Fixes
- Fixed View/Edit buttons not responding on first click
- Fixed maximize button closing window
- Fixed StepWizard state sync when switching students

---

## ⚠️ PENDING: Add Domain to Firebase

**Google login won't work until you do this:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **mn-school-sathi**
3. Go to: **Authentication → Settings → Authorized domains**
4. Add these domains:
   - `edunorm.in`
   - `www.edunorm.in`
5. Save

---

## 🔑 Environment Variables (Stored in Vercel)

All variables are configured in Vercel Dashboard:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_R2_ACCOUNT_ID`
- `VITE_R2_ACCESS_KEY_ID`
- `VITE_R2_SECRET_ACCESS_KEY`
- `VITE_R2_BUCKET_NAME`

---

## 📁 Key Files Modified Today (Feb 5)

| File | Purpose |
|------|---------|
| `ProfileViewer.jsx` | Paper size selector, batch mode, GR search |
| `ProfileViewer.css` | New controls, print styles |
| `IdCard.css` | Standard 85.6×54mm size, mm units, batch grid |
| `GeneralRegister.jsx` | stopPropagation fixes for buttons |
| `GeneralRegister.css` | Button z-index, sizing fixes |
| `StepWizard.jsx` | useEffect for initialData sync |
| `App.css` | .no-print utility class |

---

## 🏗️ Architecture

```
GitHub (DAVESIR1/EduNorm)
    ↓ Auto-deploy
Vercel (edu-norm)
    ↓ DNS
GoDaddy Domain (edunorm.in)
```

**Backup Strategy:**
```
User Data → LocalStorage + IndexedDB (immediate)
         → Cloudflare R2 (periodic + on-change)
         → Firebase Firestore (fallback)
```

---

## 📌 Accounts & Credentials

| Service | URL | Notes |
|---------|-----|-------|
| GitHub | github.com/DAVESIR1/EduNorm | Main repo |
| Vercel | vercel.com | Hosting, env vars |
| GoDaddy | dcc.godaddy.com | Domain DNS |
| Firebase | console.firebase.google.com | Project: mn-school-sathi |
| Cloudflare | dash.cloudflare.com | R2 storage |

---

## 🔧 Local Development

```bash
cd "C:\Users\acer\Documents\school student documents"
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 📋 Next Session Tasks

1. [ ] Test ID Card batch printing feature
2. [ ] Test Profile print with paper size selection
3. [ ] Add `edunorm.in` to Firebase authorized domains
4. [ ] Test Google login on live site

---

## 💡 Quick Commands

```powershell
# Build
npm run build

# Push to GitHub (triggers auto-deploy)
git add -A
git commit -m "message"
git push origin main

# Check Vercel deployment
# Visit: https://vercel.com/baraiyanitin220-3489s-projects/edu-norm
```

---

**Last Updated:** February 5, 2026 at 11:28 AM IST
