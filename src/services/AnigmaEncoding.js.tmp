import pako from 'pako';

// Helper lists
const SAFE_SYMBOLS = "!@#$%^&*()_-[]{}<>?:;|.,~";
const DIGITS = "0123456789";
const SMALL_CHARS = "abcdefghijklmnopqrstuvwxyz";
const BIG_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const getRandomSymbol = () => SAFE_SYMBOLS[Math.floor(Math.random() * SAFE_SYMBOLS.length)];
const getRandomDigit = () => DIGITS[Math.floor(Math.random() * DIGITS.length)];
const getRandomSmall = () => SMALL_CHARS[Math.floor(Math.random() * SMALL_CHARS.length)];
const getRandomBig = () => BIG_CHARS[Math.floor(Math.random() * BIG_CHARS.length)];

// Helper to check types
const isSymbol = (char) => SAFE_SYMBOLS.includes(char);
const isSmall = (char) => SMALL_CHARS.includes(char);

// Helper: Uint8Array to Base64 (Chunked to avoid stack overflow)
function uint8ArrayToBase64(uint8Array) {
    const CHUNK_SIZE = 8192;
    let result = '';
    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
        const chunk = uint8Array.subarray(i, i + CHUNK_SIZE);
        result += String.fromCharCode.apply(null, chunk);
    }
    return btoa(result);
}

// Helper: Base64 to Uint8Array
function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Encode data using Anigma method
 * @param {Object|string} data - Data to encode
 * @returns {string} - Encoded string
 */
export function encode(data) {
    try {
        const input = typeof data === 'string' ? data : JSON.stringify(data);
        const parts = [];

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            // 1. Numerical / Series: little + digit + capital (e.g. "2" -> "a2N")
            if (char >= '0' && char <= '9') {
                parts.push(getRandomSmall(), char, getRandomBig());
            }
            // 2. Big Letters: symbol + digit + symbol + character (e.g. "H" -> "@1#H")
            else if (char >= 'A' && char <= 'Z') {
                parts.push(getRandomSymbol(), getRandomDigit(), getRandomSymbol(), char);
            }
            // 3. Small Letters: symbol + digit + character (e.g. "h" -> "@5h")
            else if (char >= 'a' && char <= 'z') {
                parts.push(getRandomSymbol(), getRandomDigit(), char);
            }
            // 4. Maths Symbols: as is (Hey+123 -> ... + ...)
            else if ("+-*/=<>".includes(char)) {
                parts.push(" ", char, " ");
            }
            // 5. Space and others
            else {
                parts.push(char);
            }
        }

        return parts.join('').replace(/\s+/g, ' '); // Clean double spaces from maths
    } catch (error) {
        console.error('Anigma Encoding Failed:', error);
        throw error;
    }
}

/**
 * Decode data using Anigma method
 */
export function decode(encodedString) {
    try {
        let result = '';
        let i = 0;

        while (i < encodedString.length) {
            const char = encodedString[i];

            // Check if it was a maths symbol (padded with spaces)
            if (char === ' ' && i + 2 < encodedString.length && "+-*/=<>".includes(encodedString[i + 1]) && encodedString[i + 2] === ' ') {
                result += encodedString[i + 1];
                i += 3;
                continue;
            }

            // Small letter pattern: Sym + Digit + Char
            if (isSymbol(char) && i + 2 < encodedString.length && isSmall(encodedString[i + 2])) {
                result += encodedString[i + 2];
                i += 3;
            }
            // Big letter pattern: Sym + Digit + Sym + Char
            else if (isSymbol(char) && i + 3 < encodedString.length && isSymbol(encodedString[i + 2]) && (encodedString[i + 3] >= 'A' && encodedString[i + 3] <= 'Z')) {
                result += encodedString[i + 3];
                i += 4;
            }
            // Number pattern: small + digit + BIG
            else if (isSmall(char) && i + 2 < encodedString.length && (encodedString[i + 1] >= '0' && encodedString[i + 1] <= '9')) {
                result += encodedString[i + 1];
                i += 3;
            }
            else {
                result += char;
                i++;
            }
        }

        try {
            return JSON.parse(result);
        } catch {
            return result;
        }
    } catch (error) {
        console.error('Anigma Decoding Failed:', error);
        throw error;
    }
}

export default {
    encode,
    decode
};
