import { useState, useEffect, useMemo, useCallback } from 'react';
import * as db from '../services/database';

/**
 * useSmartAutofill — Pattern-based ghost suggestions for data entry.
 * Analyzes existing students in the current class and suggests field values
 * when >60% of students share the same value for a field.
 *
 * Usage:
 *   const { getSuggestion, acceptSuggestion } = useSmartAutofill(selectedStandard);
 *   const ghost = getSuggestion('village');
 *   // ghost = { value: 'Kheda', confidence: 0.85 } or null
 */

// Fields that make sense to autofill (skip unique fields like name, grNo, DOB)
const AUTOFILL_FIELDS = [
    'village', 'taluka', 'district', 'state', 'pincode',
    'motherTongue', 'nationality', 'religion', 'casteCategory',
    'caste', 'subCaste', 'rationCardType', 'bloodGroup',
    'bankName', 'bankBranch', 'previousSchool',
];

const CONFIDENCE_THRESHOLD = 0.6; // Only suggest if 60%+ match
const MIN_STUDENTS_FOR_SUGGESTION = 3; // Need at least 3 students before suggesting

export default function useSmartAutofill(standard) {
    const [patterns, setPatterns] = useState({});
    const [isReady, setIsReady] = useState(false);

    // Analyze existing students when standard changes
    useEffect(() => {
        if (!standard) {
            setPatterns({});
            setIsReady(false);
            return;
        }

        let cancelled = false;

        async function analyze() {
            try {
                const students = await db.getStudentsByStandard(standard);
                if (cancelled || students.length < MIN_STUDENTS_FOR_SUGGESTION) {
                    setPatterns({});
                    setIsReady(true);
                    return;
                }

                const fieldCounts = {};

                for (const field of AUTOFILL_FIELDS) {
                    const valueCounts = {};
                    let total = 0;

                    for (const student of students) {
                        const val = student[field];
                        if (val && typeof val === 'string' && val.trim()) {
                            const normalized = val.trim();
                            valueCounts[normalized] = (valueCounts[normalized] || 0) + 1;
                            total++;
                        }
                    }

                    if (total < MIN_STUDENTS_FOR_SUGGESTION) continue;

                    // Find the most common value
                    let maxVal = null;
                    let maxCount = 0;
                    for (const [v, c] of Object.entries(valueCounts)) {
                        if (c > maxCount) {
                            maxCount = c;
                            maxVal = v;
                        }
                    }

                    const confidence = maxCount / total;
                    if (confidence >= CONFIDENCE_THRESHOLD && maxVal) {
                        fieldCounts[field] = {
                            value: maxVal,
                            confidence: Math.round(confidence * 100) / 100,
                            count: maxCount,
                            total,
                        };
                    }
                }

                if (!cancelled) {
                    setPatterns(fieldCounts);
                    setIsReady(true);
                }
            } catch (err) {
                console.warn('SmartAutofill: Analysis failed', err);
                if (!cancelled) {
                    setPatterns({});
                    setIsReady(true);
                }
            }
        }

        analyze();
        return () => { cancelled = true; };
    }, [standard]);

    // Get suggestion for a specific field
    const getSuggestion = useCallback((fieldKey, currentValue = '') => {
        if (!isReady) return null;
        const pattern = patterns[fieldKey];
        if (!pattern) return null;

        // Don't suggest if user has already started typing something different
        if (currentValue && !pattern.value.toLowerCase().startsWith(currentValue.toLowerCase())) {
            return null;
        }

        // Don't suggest if the field already has the full value
        if (currentValue === pattern.value) return null;

        return pattern;
    }, [patterns, isReady]);

    // Get all available suggestions
    const allSuggestions = useMemo(() => {
        return Object.entries(patterns).map(([field, data]) => ({
            field,
            ...data,
        }));
    }, [patterns]);

    return {
        getSuggestion,
        allSuggestions,
        isReady,
        patternCount: Object.keys(patterns).length,
    };
}
