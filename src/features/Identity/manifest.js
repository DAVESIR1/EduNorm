/**
 * IDENTITY (ID Cards & Certificates) — Feature Manifest
 */

import FeatureRegistry from '../../core/FeatureRegistry.js';
import AppBus, { APP_EVENTS } from '../../core/AppBus.js';

FeatureRegistry.register({
    id: 'identity',
    name: 'ID Cards',
    icon: '🪪',
    group: 'school',
    order: 4,
    roles: ['any'],
    description: 'Student ID cards, school certificates, and digital identity document generation.',

    component: () => import('./view.jsx').then(m => ({ default: m.IdentityView || m.default })),

    onEvents: {
        // When settings change, ID card template can refresh branding (logo, school name)
        [APP_EVENTS.SETTINGS_CHANGED]: () => {
            console.log('[Identity] Settings changed — ID card will use updated school profile');
        },
        // When a student is saved, a new ID card may be needed
        [APP_EVENTS.STUDENT_SAVED]: (data) => {
            console.log('[Identity] Student saved — ID card ready for:', data?.student?.grNo);
        },
    },
});
