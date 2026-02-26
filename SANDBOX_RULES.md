# EduNorm Sandbox Architecture — Developer Rules

## ⚡ The Golden Rules (Never Break These)

```
Features NEVER import from other features.
Features communicate ONLY through AppBus.
Data access goes ONLY through database.js.
```

---

## Project Structure

```
src/
├── core/
│   ├── AppBus.js           ← Event bridge (bond between features)
│   └── FeatureRegistry.js  ← Central feature directory (bond layer)
│
├── features/               ← Each feature is a complete sandbox
│   ├── StudentManagement/
│   │   ├── manifest.js     ← Declares feature to registry (ONLY connection to app)
│   │   ├── view.jsx        ← UI only
│   │   ├── logic.js        ← Business logic only
│   │   └── types.js        ← Constants/types
│   │
│   ├── SchoolProfile/      ← Same structure
│   ├── SyncBackup/
│   ├── Identity/
│   └── AdminDashboard/
│
└── services/
    ├── database.js         ← Single source of truth for all data
    ├── DirectBackupService.js  ← Simple Firestore JSON backup
    └── BackupSandbox.js    ← SW bridge (immortal backup)
```

---

## How to Add a New Feature

1. Create `src/features/YourFeature/` folder
2. Add `manifest.js`:
```js
import FeatureRegistry from '../../core/FeatureRegistry.js';
FeatureRegistry.register({
  id: 'your-feature',
  name: 'My Feature',
  icon: '🆕',
  group: 'school',
  order: 5,
  roles: ['any'],
  component: () => import('./view.jsx'),
});
```
3. Add one line in `FeatureRegistry.js`:
```js
import './features/YourFeature/manifest.js';
```
4. **Done. No changes needed anywhere else.**

---

## How Features Communicate

```js
// Feature A: emit an event
import AppBus, { APP_EVENTS } from '../../core/AppBus.js';
AppBus.emit(APP_EVENTS.STUDENT_SAVED, { student });

// Feature B: listen (in its manifest.js or logic.js)
AppBus.on(APP_EVENTS.STUDENT_SAVED, (data) => {
  // react to the student being saved
});
```

---

## Data Changes Auto-Trigger Backup

When a student is saved/deleted, or settings change:
→ `AppBus.emit(APP_EVENTS.STUDENT_SAVED, ...)`
→ `FeatureRegistry` catches it (via `setAutoBackupHandler`)
→ `BackupSandbox.queueBackup(user)` is called
→ Service Worker picks it up and syncs to Firestore

**You never need to manually trigger backup. Just emit the right AppBus event.**

---

## What Breaks the Sandbox

| ❌ Don't do this | ✅ Do this instead |
|---|---|
| `import { x } from '../OtherFeature/view'` | `AppBus.on(APP_EVENTS.X, handler)` |
| Hardcode `case 'other-feature':` in App.jsx | Register in `manifest.js` |
| Access another feature's state directly | Emit an event, let feature handle it |
| Put feature logic in `App.jsx` | Put it in `features/Name/logic.js` |
