// src/core/v2/LifePodGenerator.js
import SovereignCore from './SovereignCore.js';

export const LifePodGenerator = {

    async generate(data) {
        if (!data) throw new Error('[LifePodGenerator] generate: data is null');

        const encryptedVault = await SovereignCore.encryptAsync(JSON.stringify(data));

        // Embed the decrypt logic inline (must mirror SovereignCore.decrypt exactly)
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Sovereign LifePod</title>
    <style>
        body { font-family: sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 2rem; }
        h1   { color: #4fc3f7; }
        pre  { background: #1a1a2e; padding: 1rem; border-radius: 8px; overflow-x: auto; white-space: pre-wrap; }
        button {
            background: #4fc3f7; color: #000; border: none;
            padding: .6rem 1.4rem; border-radius: 6px; cursor: pointer; font-size: 1rem;
        }
        button:hover { background: #81d4fa; }
        #status { margin-top: .5rem; color: #ef9a9a; font-size: .85rem; }
    </style>
</head>
<body>
    <h1>🔐 Sovereign LifePod</h1>
    <p>This is a self-contained, encrypted data pod. Press reveal to decrypt.</p>
    <button onclick="revealVault()">Reveal Data</button>
    <p id="status"></p>
    <pre id="output" style="display:none"></pre>

    <script>
        // Encrypted vault payload (generated at pod creation time)
        const VAULT = ${JSON.stringify(encryptedVault)};

        // ── Decrypt: must mirror SovereignCore.decrypt ──────────────────────
        function decrypt(encryptedText) {
            if (!encryptedText) return null;
            try {
                return encryptedText.split('|').map(group => {
                    // originalChar is always the last character of each group
                    return group[group.length - 1];
                }).join('');
            } catch (e) {
                return null;
            }
        }

        function revealVault() {
            const status = document.getElementById('status');
            const output = document.getElementById('output');
            try {
                const raw = decrypt(VAULT);
                if (!raw) throw new Error('Decryption returned empty result');
                const parsed = JSON.parse(raw);
                output.textContent = JSON.stringify(parsed, null, 2);
                output.style.display = 'block';
                status.textContent = '✅ Decrypted successfully';
                status.style.color = '#a5d6a7';
            } catch (e) {
                status.textContent = '❌ Decryption failed: ' + e.message;
            }
        }
    </script>
</body>
</html>`;

        return html;
    }
};

export default LifePodGenerator;
