/* global Image */
import { DEFAULT_FACILITIES } from './types.js';

/**
 * SOVEREIGN SCHOOL PROFILE: LOGIC
 */
export const SchoolLogic = {
    /**
     * Merges saved facilities with default ones to ensure new fields are present
     */
    mergeFacilities(savedFacilities) {
        if (!Array.isArray(savedFacilities)) return DEFAULT_FACILITIES;

        return DEFAULT_FACILITIES.map(def => {
            const savedItem = savedFacilities.find(s => s.id === def.id);
            return savedItem ? { ...def, value: savedItem.value } : def;
        });
    },

    /**
     * Compresses image for Firestore/Storage
     */
    async compressImage(file, maxWidth = 300, maxHeight = 300) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/png', 0.8));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Parses contact string into mobile and landline
     */
    parseContact(contactStr) {
        if (typeof contactStr !== 'string' || !contactStr.includes('|')) {
            return { mobile: contactStr || '', landline: '' };
        }
        const [mobile, landline] = contactStr.split('|');
        return { mobile, landline: landline || '' };
    },

    /**
     * Combines mobile and landline for storage
     */
    formatContact(mobile, landline) {
        return `${mobile || ''}|${landline || ''}`;
    }
};

export default SchoolLogic;
