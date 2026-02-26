/**
 * Register all features with FeatureRegistry.
 *
 * This file is the single entry point for feature manifest imports.
 * Import this AFTER FeatureRegistry has been defined (e.g. in App.jsx)
 * to avoid circular dependency issues.
 *
 * TO ADD A NEW FEATURE: just add one import line here.
 */

import '../features/StudentManagement/manifest.js';
import '../features/SchoolProfile/manifest.js';
import '../features/SyncBackup/manifest.js';
import '../features/Identity/manifest.js';
import '../features/AdminDashboard/manifest.js';
