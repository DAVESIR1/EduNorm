/**
 * ADMIN DASHBOARD — Feature Manifest
 */

import FeatureRegistry from '../../core/FeatureRegistry.js';

FeatureRegistry.register({
    id: 'admin-dashboard',
    name: 'Admin',
    icon: '⚙️',
    group: 'other',
    order: 10,
    roles: ['admin'],

    component: () => import('./view.jsx').then(m => ({ default: m.AdminDashboardView || m.default })),
});
