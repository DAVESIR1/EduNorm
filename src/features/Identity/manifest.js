/**
 * IDENTITY (ID Cards & Certificates) — Feature Manifest
 */

import FeatureRegistry from '../../core/FeatureRegistry.js';

FeatureRegistry.register({
    id: 'identity',
    name: 'ID Cards',
    icon: '🪪',
    group: 'school',
    order: 4,
    roles: ['any'],

    component: () => import('./view.jsx').then(m => ({ default: m.IdentityView || m.default })),
});
