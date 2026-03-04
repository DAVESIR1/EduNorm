/**
 * ADMIN DASHBOARD — Feature Manifest
 */

import FeatureRegistry from '../../core/FeatureRegistry.js';
import AppBus, { APP_EVENTS } from '../../core/AppBus.js';

FeatureRegistry.register({
    id: 'admin-dashboard',
    name: 'Admin',
    icon: '⚙️',
    group: 'other',
    order: 10,
    roles: ['admin'],
    description: 'App-wide administration — user management, audit logs, and system configuration.',

    component: () => import('./view.jsx').then(m => ({ default: m.AdminDashboardView || m.default })),

    onEvents: {
        // Refresh admin stats when students or settings change
        [APP_EVENTS.STUDENT_SAVED]: () => {
            console.log('[AdminDashboard] Student roster updated');
        },
        [APP_EVENTS.USER_LOGGED_IN]: (data) => {
            console.log('[AdminDashboard] User logged in:', data?.user?.email);
        },
    },
});
