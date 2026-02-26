/**
 * SCHOOL PROFILE — Feature Manifest
 */

import FeatureRegistry from '../../core/FeatureRegistry.js';
import AppBus, { APP_EVENTS } from '../../core/AppBus.js';

FeatureRegistry.register({
    id: 'school-profile',
    name: 'School Profile',
    icon: '🏫',
    group: 'school',
    order: 2,
    roles: ['any'],

    component: () => import('./view.jsx').then(m => ({ default: m.SchoolProfileView || m.default })),

    onEvents: {
        // When settings change, school profile can react (e.g. refresh logo)
        [APP_EVENTS.SETTINGS_CHANGED]: () => {
            // No-op by default — school profile reads from DB reactively
        },
    },
});
