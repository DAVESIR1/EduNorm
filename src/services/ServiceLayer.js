/**
 * SERVICE LAYER — EduNorm Unified Data Adapter
 *
 * SANDBOX RULE:
 *   Features should NEVER call db.* directly.
 *   They call ServiceLayer.* which:
 *     1. Executes the raw DB operation
 *     2. Emits the correct AppBus event so other features stay aware
 *     3. Returns the result
 *
 * This gives us a clean audit trail + auto-backup on every mutation.
 *
 * Usage:
 *   import SL from '../../services/ServiceLayer';
 *   const student = await SL.saveStudent(data);
 */

import * as db from './database.js';
import AppBus, { APP_EVENTS } from '../core/AppBus.js';

const ServiceLayer = {

    // ─── Students ────────────────────────────────────────────────────────────

    async saveStudent(studentData) {
        let result;
        if (studentData.id) {
            result = await db.updateStudent(studentData.id, studentData);
        } else {
            result = await db.addStudent(studentData);
        }
        AppBus.emit(APP_EVENTS.STUDENT_SAVED, { student: result || studentData });
        return result;
    },

    async deleteStudent(id) {
        await db.deleteStudent(id);
        AppBus.emit(APP_EVENTS.STUDENT_DELETED, { id });
    },

    async getStudentsByStandard(standard) {
        return db.getStudentsByStandard(standard);
    },

    async getAllStudents() {
        return db.getAllStudents();
    },

    async importStudents(students) {
        const results = [];
        for (const s of students) {
            results.push(await db.addStudent(s));
        }
        AppBus.emit(APP_EVENTS.STUDENT_IMPORTED, { count: results.length });
        return results;
    },

    async upgradeClass(fromStandard, toStandard) {
        const count = await db.upgradeClass(fromStandard, toStandard);
        AppBus.emit(APP_EVENTS.STANDARD_CHANGED, { from: fromStandard, to: toStandard });
        return count;
    },

    // ─── Settings ────────────────────────────────────────────────────────────

    async getSetting(key) {
        return db.getSetting(key);
    },

    async saveSetting(key, value) {
        await db.saveSetting(key, value);
        AppBus.emit(APP_EVENTS.SETTINGS_CHANGED, { key, value });
    },

    async saveSettings(settingsMap) {
        for (const [key, value] of Object.entries(settingsMap)) {
            await db.saveSetting(key, value);
        }
        AppBus.emit(APP_EVENTS.SETTINGS_CHANGED, { keys: Object.keys(settingsMap) });
    },

    async getAllSettings() {
        return db.getAllSettings?.() || [];
    },

    // ─── Standards ───────────────────────────────────────────────────────────

    async getStandards() {
        return db.getAllStandards?.() || [];
    },

    async getAllStandards() {
        return db.getAllStandards?.() || [];
    },

    async addStandard(standard) {
        const result = await db.addStandard(standard);
        AppBus.emit(APP_EVENTS.STANDARD_CHANGED, { added: standard });
        return result;
    },

    async deleteStandard(id) {
        await db.deleteStandard(id);
        AppBus.emit(APP_EVENTS.STANDARD_CHANGED, { deleted: id });
    },

};

export default ServiceLayer;
