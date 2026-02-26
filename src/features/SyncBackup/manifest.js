/**
 * SYNC & BACKUP — Feature Manifest
 */

import FeatureRegistry from '../../core/FeatureRegistry.js';
import { APP_EVENTS } from '../../core/AppBus.js';

FeatureRegistry.register({
    id: 'sync-backup',
    name: 'Cloud Backup',
    icon: '☁️',
    group: 'other',
    order: 1,
    roles: ['any'],

    component: () => import('./view.jsx').then(m => ({ default: m.SyncBackupView || m.default })),

    // SyncBackup reacts to backup lifecycle events — updates its own UI state
    onEvents: {
        [APP_EVENTS.BACKUP_QUEUED]: (data) => {
            console.log('[SyncBackup] Backup queued:', data?.queueId);
        },
        [APP_EVENTS.BACKUP_COMPLETE]: (data) => {
            console.log('[SyncBackup] Backup complete:', data?.synced, 'records');
        },
    },
});
