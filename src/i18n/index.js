// Language Translations Index
// Supports 25+ languages including Indian regional + modern variants

import en from './translations/en';
import hi from './translations/hi';
import hinglish from './translations/hinglish';
import gu from './translations/gu';
import gujlish from './translations/gujlish';

// All available languages
export const languages = {
    en: { name: 'English', nativeName: 'English', flag: '🇺🇸', translations: en },
    hi: { name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', translations: hi },
    hinglish: { name: 'Hinglish', nativeName: 'Hinglish', flag: '🇮🇳', translations: hinglish, variant: true },
    gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', translations: gu },
    gujlish: { name: 'Gujlish', nativeName: 'Gujlish', flag: '🇮🇳', translations: gujlish, variant: true },
    // Placeholder for additional languages (use English as fallback)
    mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', translations: hi }, // Placeholder
    ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', translations: en },
    te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', translations: en },
    kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', translations: en },
    ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', translations: en },
    bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', translations: en },
    pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', translations: en },
    or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', translations: en },
    as: { name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳', translations: en },
    ur: { name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', translations: hi },
    // International languages
    es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', translations: en },
    fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷', translations: en },
    de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', translations: en },
    it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', translations: en },
    pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', translations: en },
    ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', translations: en },
    ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', translations: en },
    ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷', translations: en },
    zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳', translations: en },
    ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', translations: en, rtl: true },
    ne: { name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', translations: hi },
};

// Language categories for UI organization
export const languageCategories = {
    indian: {
        label: 'Indian Languages',
        languages: ['hi', 'gu', 'mr', 'ta', 'te', 'kn', 'ml', 'bn', 'pa', 'or', 'as', 'ur']
    },
    modern: {
        label: 'Modern Variants',
        languages: ['hinglish', 'gujlish']
    },
    international: {
        label: 'International',
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'ne']
    }
};

// Get translation with fallback to English
export function getTranslation(langCode, path) {
    const lang = languages[langCode] || languages.en;
    const keys = path.split('.');

    let value = lang.translations;
    for (const key of keys) {
        value = value?.[key];
        if (value === undefined) {
            // Fallback to English
            value = keys.reduce((obj, k) => obj?.[k], languages.en.translations);
            break;
        }
    }

    return value || path;
}

// Hook-friendly translation function factory
export function createTranslator(langCode) {
    return (path) => getTranslation(langCode, path);
}

// Default export
export default languages;
