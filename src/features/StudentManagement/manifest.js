/**
 * STUDENT MANAGEMENT — Feature Manifest
 * Self-describing sandbox declaration.
 * This file is the ONLY connection between this feature and the rest of the app.
 */

import FeatureRegistry from '../../core/FeatureRegistry.js';
import AppBus, { APP_EVENTS } from '../../core/AppBus.js';

FeatureRegistry.register({
    id: 'student-management',
    name: 'Students',
    icon: '📚',
    group: 'school',
    order: 1,
    roles: ['any'],

    // Lazy-loaded: only downloaded when the user navigates here
    component: () => import('./view.jsx').then(m => ({ default: m.StudentManagementView || m.default })),

    // AppBus events this feature reacts to (no imports needed)
    onEvents: {
        [APP_EVENTS.STANDARD_CHANGED]: (data) => {
            // When selected standard changes, this feature will receive it
            // via the AppBus — no prop drilling needed
            AppBus.emit(APP_EVENTS.STUDENT_IMPORTED, { trigger: 'standard_change', ...data });
        },
    },
});
