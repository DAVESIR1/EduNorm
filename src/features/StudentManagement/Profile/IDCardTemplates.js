// ID Card Template Definitions
// 10+ Attractive Pre-designed Templates

export const ID_CARD_TEMPLATES = {
    classic: {
        name: 'Classic',
        description: 'Traditional school ID card design',
        colors: {
            primary: '#1a365d',
            secondary: '#2b6cb0',
            accent: '#f6e05e',
            background: '#ffffff',
            text: '#1a202c'
        },
        layout: 'horizontal',
        features: ['schoolLogo', 'photo', 'barcode']
    },
    modern: {
        name: 'Modern Gradient',
        description: 'Sleek gradient design with rounded corners',
        colors: {
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#f093fb',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            text: '#ffffff'
        },
        layout: 'horizontal',
        features: ['schoolLogo', 'photo', 'qrCode']
    },
    minimal: {
        name: 'Minimal White',
        description: 'Clean minimalist design',
        colors: {
            primary: '#2d3748',
            secondary: '#718096',
            accent: '#48bb78',
            background: '#ffffff',
            text: '#2d3748'
        },
        layout: 'vertical',
        features: ['photo', 'qrCode']
    },
    professional: {
        name: 'Professional Blue',
        description: 'Corporate style professional card',
        colors: {
            primary: '#0d47a1',
            secondary: '#1565c0',
            accent: '#42a5f5',
            background: '#e3f2fd',
            text: '#0d47a1'
        },
        layout: 'horizontal',
        features: ['schoolLogo', 'photo', 'barcode', 'hologram']
    },
    vibrant: {
        name: 'Vibrant Orange',
        description: 'Energetic and eye-catching design',
        colors: {
            primary: '#f97316',
            secondary: '#ea580c',
            accent: '#fbbf24',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            text: '#ffffff'
        },
        layout: 'horizontal',
        features: ['schoolLogo', 'photo', 'qrCode']
    },
    nature: {
        name: 'Nature Green',
        description: 'Eco-friendly green theme',
        colors: {
            primary: '#059669',
            secondary: '#10b981',
            accent: '#34d399',
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            text: '#065f46'
        },
        layout: 'vertical',
        features: ['schoolLogo', 'photo', 'qrCode']
    },
    elegant: {
        name: 'Elegant Gold',
        description: 'Luxurious gold accented design',
        colors: {
            primary: '#1e1e2e',
            secondary: '#2d2d44',
            accent: '#d4af37',
            background: '#1e1e2e',
            text: '#ffffff'
        },
        layout: 'horizontal',
        features: ['schoolLogo', 'photo', 'foilStamp']
    },
    playful: {
        name: 'Playful Kids',
        description: 'Fun design for primary schools',
        colors: {
            primary: '#ec4899',
            secondary: '#8b5cf6',
            accent: '#06b6d4',
            background: 'linear-gradient(135deg, #fce7f3 0%, #ddd6fe 50%, #cffafe 100%)',
            text: '#6b21a8'
        },
        layout: 'vertical',
        features: ['schoolLogo', 'photo', 'funBorder']
    },
    techie: {
        name: 'Tech Dark',
        description: 'Modern dark theme for tech schools',
        colors: {
            primary: '#00d4ff',
            secondary: '#7c3aed',
            accent: '#22c55e',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            text: '#f1f5f9'
        },
        layout: 'horizontal',
        features: ['photo', 'qrCode', 'chipDesign']
    },
    royal: {
        name: 'Royal Maroon',
        description: 'Prestigious royal inspired design',
        colors: {
            primary: '#7f1d1d',
            secondary: '#991b1b',
            accent: '#fbbf24',
            background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
            text: '#fef3c7'
        },
        layout: 'horizontal',
        features: ['schoolLogo', 'photo', 'crest']
    },
    ocean: {
        name: 'Ocean Wave',
        description: 'Calming blue wave design',
        colors: {
            primary: '#0284c7',
            secondary: '#0369a1',
            accent: '#38bdf8',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%)',
            text: '#0c4a6e'
        },
        layout: 'vertical',
        features: ['schoolLogo', 'photo', 'wavePattern']
    },
    sunset: {
        name: 'Sunset Warm',
        description: 'Warm sunset gradient colors',
        colors: {
            primary: '#dc2626',
            secondary: '#ea580c',
            accent: '#fbbf24',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fed7aa 50%, #fef3c7 100%)',
            text: '#7c2d12'
        },
        layout: 'horizontal',
        features: ['schoolLogo', 'photo', 'qrCode']
    }
};

// Default fields shown on ID cards
export const DEFAULT_ID_FIELDS = [
    { key: 'photo', label: 'Photo', required: true, position: 'top' },
    { key: 'grNo', label: 'GR No.', required: true },
    { key: 'studentFirstName', label: 'First Name', required: true },
    { key: 'studentLastName', label: 'Last Name', required: true },
    { key: 'standard', label: 'Class', required: true },
    { key: 'rollNo', label: 'Roll No.', required: false },
    { key: 'studentBirthdate', label: 'DOB', required: false },
    { key: 'contactNumber', label: 'Phone', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'bloodGroup', label: 'Blood Group', required: false }
];

// Get template by ID
export function getTemplate(templateId) {
    return ID_CARD_TEMPLATES[templateId] || ID_CARD_TEMPLATES.classic;
}

// Get all template options for dropdown
export function getTemplateOptions() {
    return Object.entries(ID_CARD_TEMPLATES).map(([id, template]) => ({
        id,
        ...template
    }));
}

export default ID_CARD_TEMPLATES;
