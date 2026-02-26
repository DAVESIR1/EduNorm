import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import sandboxPlugin from './scripts/eslint-plugin-sandbox.cjs';

export default [
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx,mjs,cjs}'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            sandbox: sandboxPlugin,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                process: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                localStorage: 'readonly',
                navigator: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                Blob: 'readonly',
                FileReader: 'readonly',
            },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'no-unused-vars': 'warn',
            'sandbox/no-cross-feature-import': 'error',
        },
        settings: {
            react: {
                version: '18.2',
            },
        },
    },
];
