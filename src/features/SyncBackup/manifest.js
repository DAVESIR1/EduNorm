import FeatureRegistry from '../../core/FeatureRegistry.js';
import { APP_EVENTS } from '../../core/AppBus.js';

FeatureRegistry.register({
    id: 'sync-backup',
    name: 'Backup & Sync',
    icon: '☁️',
    group: 'other',
    order: 5,
    roles: ['any'],
    description: 'Firebase + Google Drive backup. Auto every 5 min, manual restore anytime.',
    component: () => import('./view.jsx'),
    onEvents: {
        [APP_EVENTS.BACKUP_REQUESTED]: (data) => {
            console.log('[SyncBackup] Backup requested:', data?.userId);
        },
        [APP_EVENTS.RESTORE_COMPLETE]: (data) => {
            console.log('[SyncBackup] Restore complete:', data?.count, 'records');
        },
        [APP_EVENTS.SYNC_FAILED]: (data) => {
            console.warn('[SyncBackup] Sync failed:', data?.error);
        },
    },
});
