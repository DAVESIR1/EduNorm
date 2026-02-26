/**
 * EDUNORM SANDBOX ENFORCEMENT — Custom ESLint Rule
 * 
 * Rule: no-cross-feature-import
 * 
 * BLOCKS: Any import from one feature's folder directly into another feature's folder.
 * ALLOWS: Imports from core/, services/, shared/, components/, styles/, contexts/, config/, utils/
 * ALLOWS: Imports within the SAME feature folder
 * ADMIN OVERRIDE: Add comment  // eslint-disable-next-line sandbox/no-cross-feature-import
 *                 Then add a reason: // ADMIN_OVERRIDE: <reason>
 * 
 * Author: EduNorm Architecture System
 * Version: 1.0.0 — immutable without admin intervention
 */

'use strict';

const path = require('path');

// ─── Allowed cross-boundary paths ────────────────────────────────────────────
// These paths are the "bond layer" — any feature may import from them
const ALLOWED_SHARED_PATHS = [
    'core/',
    'services/',
    'shared/',
    'components/',
    'styles/',
    'contexts/',
    'config/',
    'utils/',
    'hooks/',
    'i18n/',
];

// ─── The Rule ─────────────────────────────────────────────────────────────────
const noCrossFeatureImport = {
    meta: {
        type: 'error',
        docs: {
            description: 'Prevent features from importing directly from other feature sandboxes.',
            category: 'EduNorm Sandbox Rules',
            recommended: true,
        },
        schema: [],
        messages: {
            crossFeatureImport:
                '🚫 SANDBOX VIOLATION: "{{importer}}" cannot import from "{{imported}}".\n' +
                '   Features must NEVER import from other features directly.\n' +
                '   Use AppBus events instead: AppBus.emit(APP_EVENTS.X, data)\n' +
                '   See SANDBOX_RULES.md for details.\n' +
                '   If this is truly necessary, get admin approval and add:\n' +
                '   // ADMIN_OVERRIDE: <reason>',
        },
    },

    create(context) {
        const filename = context.filename || context.getFilename();
        const srcIndex = filename.replace(/\\/g, '/').lastIndexOf('/src/');
        if (srcIndex === -1) return {}; // Not in src/ — skip

        const relativePath = filename.substring(srcIndex + 1).replace(/\\/g, '/'); // e.g. src/features/StudentManagement/view.jsx

        // Only enforce for files inside src/features/
        const featureMatch = relativePath.match(/^src\/features\/([^/]+)\//);
        if (!featureMatch) return {};

        const currentFeature = featureMatch[1]; // e.g. "StudentManagement"

        return {
            ImportDeclaration(node) {
                const importSource = node.source.value;

                // Skip node_modules, absolute imports, and non-relative imports
                if (!importSource.startsWith('.')) return;

                // Resolve the import path relative to the current file
                const importerDir = path.dirname(filename);
                const resolvedPath = path.resolve(importerDir, importSource).replace(/\\/g, '/');
                const resolvedRelative = resolvedPath.substring(resolvedPath.lastIndexOf('/src/') + 1);

                // Check if importing from another feature's folder
                const targetFeatureMatch = resolvedRelative.match(/^src\/features\/([^/]+)\//);
                if (!targetFeatureMatch) return; // Not targeting a feature folder — allowed

                const targetFeature = targetFeatureMatch[1];
                if (targetFeature === currentFeature) return; // Same feature — allowed

                // 🚫 Cross-feature import detected
                context.report({
                    node,
                    messageId: 'crossFeatureImport',
                    data: {
                        importer: `features/${currentFeature}`,
                        imported: `features/${targetFeature}`,
                    },
                });
            },
        };
    },
};

// ─── Plugin Export ────────────────────────────────────────────────────────────
module.exports = {
    rules: {
        'no-cross-feature-import': noCrossFeatureImport,
    },
    configs: {
        recommended: {
            plugins: ['sandbox'],
            rules: {
                'sandbox/no-cross-feature-import': 'error',
            },
        },
    },
};
