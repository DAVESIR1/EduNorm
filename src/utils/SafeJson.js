/**
 * Utility to safely stringify objects, handling circular references
 * and ensuring data integrity for encryption/storage.
 */

// Simple circular reference replacer
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);
        }
        return value;
    };
};

/**
 * Safely stringify an object, preventing circular reference crashes
 */
export function safeJsonStringify(obj, space = 0) {
    try {
        return JSON.stringify(obj, getCircularReplacer(), space);
    } catch (error) {
        console.error('SafeJson: Failed to stringify object:', error);
        return '{}';
    }
}

/**
 * Safely parse JSON, returning null or default value on failure
 */
export function safeJsonParse(str, defaultValue = null) {
    try {
        return JSON.parse(str);
    } catch (error) {
        console.error('SafeJson: Failed to parse string:', error);
        return defaultValue;
    }
}

export default {
    stringify: safeJsonStringify,
    parse: safeJsonParse
};
