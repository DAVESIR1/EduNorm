import { encode, decode } from './src/services/AnigmaEncoding.js';

const testCases = [
    "hello",
    "HELLO",
    "Hello",
    "23456",
    "Hey+123",
    "abc@123",
    JSON.stringify({ test: "data", val: 123 })
];

console.log("--- Enigma Verification ---");
testCases.forEach(test => {
    try {
        const encoded = encode(test);
        const decoded = decode(encoded);
        console.log(`Input:   ${test}`);
        console.log(`Encoded: ${encoded}`);
        console.log(`Decoded: ${decoded}`);
        console.log(`Match:   ${test === (typeof decoded === 'object' ? JSON.stringify(decoded) : decoded)}`);
        console.log('---');
    } catch (e) {
        console.error(`Error for [${test}]:`, e.message);
    }
});
