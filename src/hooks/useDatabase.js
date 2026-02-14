import { useState, useEffect, useCallback } from 'react';
import * as db from '../services/database';

// Hook for settings
export function useSettings() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    const loadSettings = useCallback(async () => {
        try {
            const allSettings = await db.getAllSettings();
            const settingsObj = {};
            allSettings.forEach(s => {
                settingsObj[s.key] = s.value;
            });
            setSettings(settingsObj);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const updateSetting = useCallback(async (key, value) => {
        await db.setSetting(key, value);
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    return { settings, loading, updateSetting, refreshSettings: loadSettings };
}

// Hook for students
export function useStudents(standard = null) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadStudents = useCallback(async () => {
        try {
            setLoading(true);
            const data = standard
                ? await db.getStudentsByStandard(standard)
                : await db.getAllStudents();
            setStudents(data);
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            setLoading(false);
        }
    }, [standard]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const addStudent = useCallback(async (studentData) => {
        const newStudent = await db.addStudent(studentData);
        setStudents(prev => [...prev, newStudent]);
        return newStudent;
    }, []);

    const updateStudent = useCallback(async (id, data) => {
        const updated = await db.updateStudent(id, data);
        setStudents(prev => prev.map(s => s.id === id ? updated : s));
        return updated;
    }, []);

    const deleteStudent = useCallback(async (id) => {
        await db.deleteStudent(id);
        setStudents(prev => prev.filter(s => s.id !== id));
    }, []);

    return {
        students,
        loading,
        addStudent,
        updateStudent,
        deleteStudent,
        refreshStudents: loadStudents
    };
}

// Hook for standards
export function useStandards() {
    const [standards, setStandards] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadStandards = useCallback(async () => {
        try {
            const data = await db.getAllStandards();
            setStandards(data);
        } catch (error) {
            console.error('Failed to load standards:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStandards();
    }, [loadStandards]);

    const addStandard = useCallback(async (data) => {
        await db.addStandard(data);
        await loadStandards();
    }, [loadStandards]);

    const updateStandard = useCallback(async (id, data) => {
        await db.updateStandard(id, data);
        await loadStandards();
    }, [loadStandards]);

    const deleteStandard = useCallback(async (id) => {
        await db.deleteStandard(id);
        await loadStandards();
    }, [loadStandards]);

    return { standards, loading, addStandard, updateStandard, deleteStandard, refreshStandards: loadStandards };
}

// Hook for custom fields
export function useCustomFields() {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFields = useCallback(async () => {
        try {
            const data = await db.getAllCustomFields();
            setFields(data);
        } catch (error) {
            console.error('Failed to load custom fields:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFields();
    }, [loadFields]);

    const addField = useCallback(async (data) => {
        await db.addCustomField(data);
        await loadFields();
    }, [loadFields]);

    const updateField = useCallback(async (id, data) => {
        await db.updateCustomField(id, data);
        await loadFields();
    }, [loadFields]);

    const deleteField = useCallback(async (id) => {
        await db.deleteCustomField(id);
        await loadFields();
    }, [loadFields]);

    return { fields, loading, addField, updateField, deleteField, refreshFields: loadFields };
}

// Hook for ledger
export function useLedger() {
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadLedger = useCallback(async () => {
        try {
            const data = await db.getLedger();
            setLedger(data);
        } catch (error) {
            console.error('Failed to load ledger:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLedger();
    }, [loadLedger]);

    return { ledger, loading, refreshLedger: loadLedger };
}

// Hook for search
export function useStudentSearch() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');

    const search = useCallback(async (searchQuery) => {
        setQuery(searchQuery);
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            const data = await db.searchStudents(searchQuery);
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { results, loading, query, search };
}

// Theme hooking is now handled by contexts/ThemeContext.jsx
// export function useTheme() { ... } moved

