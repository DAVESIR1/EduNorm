/**
 * SHARED FIELD CONSTANTS
 *
 * DATA_FIELDS is the single source of truth for student data schema.
 * It lives here in shared/ so any file can import it safely WITHOUT
 * creating a cross-feature dependency on StudentManagement.
 *
 * Rule: features/StudentManagement/types.js re-exports from here.
 *       No other file should import from features/StudentManagement/types.js directly.
 */

export { DATA_FIELDS, CSV_HEADERS, SORT_FIELDS, MIGRATION_STATES } from '../../features/StudentManagement/types.js';
