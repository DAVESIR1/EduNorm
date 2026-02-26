#!/usr/bin/env node
/**
 * EduNorm Doctor Tool (ENHANCED v2)
 * 
 * Now catches the REAL problems:
 * ─────────────────────────────────────────
 * 1. IMPORT INTEGRITY — verifies every lazy import resolves to a real file
 * 2. CODE TRUNCATION — detects AI placeholder comments (rest of... patterns)
    * 3. SWITCH CASE AUDIT — counts switch cases in App.jsx, warns if any disappeared
        * 4. CSS SYNTAX — brace matching
            * 5. ENVIRONMENT — node version, filesystem
                * 6. LIVE BROWSER ERRORS — HTTP server on port 3001
                    * 
 * Usage:
 * node scripts / doctor.cjs--check      # one - time scan
    * node scripts / doctor.cjs              # continuous mode(wraps vite)
        */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Colors
const C = {
    reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
    bold: '\x1b[1m', dim: '\x1b[2m',
};

const REPORT_FILE = path.join(process.cwd(), 'doctor-report.txt');
const REPORT_JSON = path.join(process.cwd(), 'doctor-report.json');
const DASHBOARD_FILE = path.join(process.cwd(), 'doctor-dashboard.html');
const LOG_PORT = 3001;

// ─── CRITICAL FILES — Doctor tracks these specifically ───────────────────────
// If switch cases, imports, or code lines drop below these thresholds, Doctor raises an alarm
const CRITICAL_FILE_RULES = {
    'src/App.jsx': {
        minSwitchCases: 25,          // App.jsx switch must have at least 25 cases
        minLines: 800,               // App.jsx must be at least 800 lines
        requiredCases: [             // These cases MUST exist
            'school-profile', 'general-register', 'student-profile', 'id-card',
            'certificate', 'backup-restore', 'cloud-backup', 'teachers-profile',
            'staff-info', 'hoi-diary', 'salary-book', 'class-upgrade',
            'class-management', 'class-management-teacher',
            'student-login', 'correction-request', 'certificate-download', 'qa-chat',
            'custom-window', 'custom-window-hoi', 'custom-window-teacher',
            'usage-instructions', 'help-support',
        ],
    },
    'src/contexts/MenuContext.jsx': {
        minLines: 200,
    },
    'src/components/Layout/NewSidebar.jsx': {
        minLines: 350,
    },
};

// ─── TRUNCATION PATTERNS — AI agents leave these signatures ──────────────────
const TRUNCATION_PATTERNS = [
    /\/\*\s*\.\.\.\s*\(rest\s+of/i,                    // /* ... (rest of ...) ... */
    /\/\*\s*\.\.\.\s*\(remaining/i,                     // /* ... (remaining ...) ... */
    /\/\/\s*\.\.\.\s*rest\s+of/i,                       // // ... rest of ...
    /\/\/\s*\.\.\.\s*\([\w\s]+\)\s*\.\.\./i,           // // ... (something) ...
    /\{\/\*\s*\.\.\.\s*\(/i,                            // {/* ... (
    /\/\*\s*truncated/i,                                // /* truncated */
    /\/\/\s*TODO:\s*restore/i,                          // // TODO: restore
    /\/\*\s*omitted/i,                                  // /* omitted */
];

class Doctor {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.startTime = new Date();
        this.isCheckOnly = process.argv.includes('--check');
        this.server = null;
    }

    log(level, msg) {
        const time = new Date().toLocaleTimeString();
        const prefix = {
            error: `${C.red}${C.bold}✖ ERROR${C.reset}`,
            warn: `${C.yellow}⚠ WARN${C.reset}`,
            info: `${C.blue}ℹ INFO${C.reset}`,
            success: `${C.green}✔ OK${C.reset}`,
            doctor: `${C.magenta}🩺 DOCTOR${C.reset}`,
        }[level] || `${C.gray}  LOG${C.reset}`;
        console.log(`${C.gray}[${time}]${C.reset} ${prefix}  ${msg}`);
    }

    notify(title, message) {
        if (process.platform === 'win32') {
            const escapedTitle = title.replace(/"/g, '\\"');
            const escapedMsg = message.replace(/"/g, '\\"');
            exec(`powershell -Command "[reflection.assembly]::loadwithpartialname('System.Windows.Forms'); $notify = new-object system.windows.forms.notifyicon; $notify.icon = [System.Drawing.SystemIcons]::Information; $notify.visible = $true; $notify.showballoontip(10, '${escapedTitle}', '${escapedMsg}', [system.windows.forms.tooltipicon]::Info)"`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 1: IMPORT INTEGRITY
    // Verify every lazy(() => import('./path')) resolves to a real file
    // ═══════════════════════════════════════════════════════════════════════════
    runImportCheck() {
        this.log('doctor', 'Checking import integrity...');
        const appJsx = path.join(process.cwd(), 'src/App.jsx');
        if (!fs.existsSync(appJsx)) {
            this.errors.push({ time: new Date(), message: 'src/App.jsx is MISSING!', type: 'import' });
            return;
        }

        const content = fs.readFileSync(appJsx, 'utf8');
        const importRegex = /import\(['"]([^'"]+)['"]\)/g;
        let match;
        let checked = 0;
        let broken = 0;

        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (!importPath.startsWith('.')) continue; // skip node_modules

            checked++;
            const basePath = path.resolve(path.dirname(appJsx), importPath);
            const extensions = ['', '.jsx', '.js', '.tsx', '.ts'];
            const found = extensions.some(ext => fs.existsSync(basePath + ext));

            if (!found) {
                broken++;
                this.errors.push({
                    time: new Date(),
                    message: `[BROKEN IMPORT] App.jsx imports "${importPath}" but file not found.\n  Checked: ${extensions.map(e => basePath + e).join(', ')}`,
                    type: 'import'
                });
                this.log('error', `Broken import: ${importPath}`);
            }
        }

        this.log(broken > 0 ? 'error' : 'success',
            `Import check: ${checked} imports scanned, ${broken} broken`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 2: CODE TRUNCATION DETECTION
    // AI agents sometimes replace code with "/* ... (rest of ...) ... */"
    // ═══════════════════════════════════════════════════════════════════════════
    runTruncationCheck() {
        this.log('doctor', 'Scanning for AI code truncation...');
        const srcDir = path.join(process.cwd(), 'src');
        let totalFiles = 0;
        let truncatedFiles = 0;

        const scanDir = (dir) => {
            try {
                for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        scanDir(fullPath);
                    } else if (/\.(jsx?|tsx?|css)$/.test(entry.name)) {
                        totalFiles++;
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const relPath = path.relative(process.cwd(), fullPath);
                        const lines = content.split('\n');

                        for (let i = 0; i < lines.length; i++) {
                            for (const pattern of TRUNCATION_PATTERNS) {
                                if (pattern.test(lines[i])) {
                                    truncatedFiles++;
                                    const msg = `[TRUNCATED CODE] ${relPath}:${i + 1} — "${lines[i].trim()}"`;
                                    this.errors.push({ time: new Date(), message: msg, type: 'truncation' });
                                    this.log('error', msg);
                                    break; // Report once per line
                                }
                            }
                        }
                    }
                }
            } catch (e) { }
        };

        scanDir(srcDir);
        this.log(truncatedFiles > 0 ? 'error' : 'success',
            `Truncation scan: ${totalFiles} files checked, ${truncatedFiles} truncation patterns found`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 3: CRITICAL FILE AUDIT
    // Verify switch cases, line counts, and required patterns in key files
    // ═══════════════════════════════════════════════════════════════════════════
    runCriticalFileAudit() {
        this.log('doctor', 'Auditing critical files...');

        for (const [filePath, rules] of Object.entries(CRITICAL_FILE_RULES)) {
            const fullPath = path.join(process.cwd(), filePath);
            if (!fs.existsSync(fullPath)) {
                this.errors.push({ time: new Date(), message: `CRITICAL FILE MISSING: ${filePath}`, type: 'audit' });
                this.log('error', `Missing: ${filePath}`);
                continue;
            }

            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');

            // Line count check
            if (rules.minLines && lines.length < rules.minLines) {
                this.errors.push({
                    time: new Date(),
                    message: `[FILE SHRUNK] ${filePath} has ${lines.length} lines (minimum: ${rules.minLines}). Code may have been truncated!`,
                    type: 'audit'
                });
                this.log('error', `${filePath}: ${lines.length} lines (expected ≥${rules.minLines})`);
            } else if (rules.minLines) {
                this.log('success', `${filePath}: ${lines.length} lines (≥${rules.minLines} ✓)`);
            }

            // Switch case count
            if (rules.minSwitchCases) {
                const caseMatches = content.match(/case\s+'[^']+'/g) || [];
                const caseCount = caseMatches.length;
                if (caseCount < rules.minSwitchCases) {
                    this.errors.push({
                        time: new Date(),
                        message: `[CASES MISSING] ${filePath} has ${caseCount} switch cases (minimum: ${rules.minSwitchCases}). Menu routing was damaged!`,
                        type: 'audit'
                    });
                    this.log('error', `${filePath}: ${caseCount} switch cases (expected ≥${rules.minSwitchCases})`);
                } else {
                    this.log('success', `${filePath}: ${caseCount} switch cases (≥${rules.minSwitchCases} ✓)`);
                }
            }

            // Required cases
            if (rules.requiredCases) {
                const missingCases = [];
                for (const caseName of rules.requiredCases) {
                    if (!content.includes(`case '${caseName}'`)) {
                        missingCases.push(caseName);
                    }
                }
                if (missingCases.length > 0) {
                    this.errors.push({
                        time: new Date(),
                        message: `[MISSING CASES] ${filePath} is missing these switch cases:\n  ${missingCases.join(', ')}`,
                        type: 'audit'
                    });
                    this.log('error', `${filePath}: Missing cases: ${missingCases.join(', ')}`);
                } else {
                    this.log('success', `${filePath}: All ${rules.requiredCases.length} required cases present ✓`);
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 4: CSS SYNTAX
    // ═══════════════════════════════════════════════════════════════════════════
    runCSSCheck() {
        this.log('doctor', 'Checking CSS health...');
        const cssDir = path.join(process.cwd(), 'src');
        const findCSS = (dir) => {
            let files = [];
            try {
                for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        files = files.concat(findCSS(fullPath));
                    } else if (entry.name.endsWith('.css')) {
                        files.push(fullPath);
                    }
                }
            } catch (e) { }
            return files;
        };

        const cssFiles = findCSS(cssDir);
        let syntaxErrors = 0;

        cssFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const relPath = path.relative(process.cwd(), file);
            let braceDepth = 0;
            let inComment = false;
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                let lineClean = "";
                for (let j = 0; j < line.length; j++) {
                    if (!inComment && line[j] === '/' && line[j + 1] === '*') { inComment = true; j++; continue; }
                    if (inComment && line[j] === '*' && line[j + 1] === '/') { inComment = false; j++; continue; }
                    if (!inComment) lineClean += line[j];
                }
                for (const ch of lineClean) {
                    if (ch === '{') braceDepth++;
                    if (ch === '}') braceDepth--;
                }
                if (braceDepth < 0) {
                    syntaxErrors++;
                    this.errors.push({ time: new Date(), message: `[css-syntax] ${relPath}:${i + 1} — unexpected '}'`, type: 'css-syntax' });
                    braceDepth = 0;
                    break;
                }
            }
            if (braceDepth > 0) {
                syntaxErrors++;
                this.errors.push({ time: new Date(), message: `${relPath} — unclosed '{'`, type: 'css-syntax' });
            }
        });

        this.log(syntaxErrors > 0 ? 'error' : 'success', `CSS check: ${cssFiles.length} files, ${syntaxErrors} syntax errors`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 6: ORPHAN CSS DETECTION
    // Verify important CSS files are actually imported somewhere
    // Root cause of the glassmorphism-force.css bug: file existed but wasn't imported
    // ═══════════════════════════════════════════════════════════════════════════
    runOrphanCSSCheck() {
        this.log('doctor', 'Checking for orphan CSS files...');
        // CSS files in src/styles/ should always be imported
        const stylesDir = path.join(process.cwd(), 'src', 'styles');
        if (!fs.existsSync(stylesDir)) return;

        const cssInStyles = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));
        const srcDir = path.join(process.cwd(), 'src');

        // Build a set of all import references across JS/JSX/CSS files
        const allImportRefs = new Set();
        const scanImports = (dir) => {
            try {
                for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        scanImports(fullPath);
                    } else if (/\.(jsx?|tsx?|css)$/.test(entry.name)) {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        // Match JS imports: import './styles/foo.css'
                        const jsImports = content.matchAll(/import\s+['"]([^'"]+\.css)['"];?/g);
                        for (const m of jsImports) allImportRefs.add(path.basename(m[1]));
                        // Match CSS @import: @import url('./foo.css')
                        const cssImports = content.matchAll(/@import\s+(?:url\()?['"]([^'"]+\.css)['"]\)?/g);
                        for (const m of cssImports) allImportRefs.add(path.basename(m[1]));
                    }
                }
            } catch (e) { }
        };
        scanImports(srcDir);

        let orphans = 0;
        for (const cssFile of cssInStyles) {
            if (!allImportRefs.has(cssFile)) {
                orphans++;
                this.errors.push({
                    time: new Date(),
                    message: `[ORPHAN CSS] src/styles/${cssFile} is NOT imported anywhere! It will NOT be loaded by the app.`,
                    type: 'orphan-css'
                });
                this.log('error', `Orphan CSS: src/styles/${cssFile} — not imported anywhere`);
            }
        }
        this.log(orphans > 0 ? 'error' : 'success', `Orphan CSS check: ${cssInStyles.length} style files, ${orphans} orphans`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 7: MENU CONSISTENCY
    // Verify sidebar and menu components check the same field for Coming Soon
    // Root cause: NewSidebar used item.comingSoon, MenuContext used item.status
    // ═══════════════════════════════════════════════════════════════════════════
    runMenuConsistencyCheck() {
        this.log('doctor', 'Checking menu/submenu consistency...');
        const sidebarPath = path.join(process.cwd(), 'src/components/Layout/NewSidebar.jsx');
        const mainMenuPath = path.join(process.cwd(), 'src/components/Menu/MainMenu.jsx');
        const menuContextPath = path.join(process.cwd(), 'src/contexts/MenuContext.jsx');
        let issues = 0;

        // Check that sidebar uses item.status, not item.comingSoon
        if (fs.existsSync(sidebarPath)) {
            const content = fs.readFileSync(sidebarPath, 'utf8');
            if (content.includes('item.comingSoon')) {
                issues++;
                this.errors.push({
                    time: new Date(),
                    message: `[MENU MISMATCH] NewSidebar.jsx uses "item.comingSoon" but MenuContext uses "item.status === 'coming-soon'". Sidebar will never correctly detect coming-soon items.`,
                    type: 'menu-consistency'
                });
                this.log('error', 'NewSidebar uses item.comingSoon instead of item.status');
            }
        }

        // Verify MenuContext has required menu sections
        if (fs.existsSync(menuContextPath)) {
            const content = fs.readFileSync(menuContextPath, 'utf8');
            const requiredMenus = ['school', 'hoi', 'teacher', 'student', 'other', 'dataManagement'];
            for (const menu of requiredMenus) {
                if (!content.includes(`id: '${menu}'`)) {
                    issues++;
                    this.errors.push({
                        time: new Date(),
                        message: `[MENU MISSING] MenuContext is missing the '${menu}' menu section.`,
                        type: 'menu-consistency'
                    });
                    this.log('error', `MenuContext missing menu: ${menu}`);
                }
            }
        }

        this.log(issues > 0 ? 'error' : 'success', `Menu consistency: ${issues} issues`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 8: SYNC INTEGRITY
    // Verify sync code doesn't use process.env (Node.js) in browser code,
    // and that Bridge methods reference functions that actually exist.
    // ═══════════════════════════════════════════════════════════════════════════
    runSyncIntegrityCheck() {
        this.log('doctor', 'Checking sync system integrity...');
        let issues = 0;
        const srcDir = path.join(process.cwd(), 'src');

        // Check for process.env in browser code (should use import.meta.env)
        const browserFiles = ['core/v2/InfinitySync.js', 'core/v2/SovereignSync.js', 'core/v2/Bridge.js'];
        for (const file of browserFiles) {
            const fullPath = path.join(srcDir, file);
            if (!fs.existsSync(fullPath)) continue;
            const content = fs.readFileSync(fullPath, 'utf8');
            // Match process.env but not inside comments
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('//') || line.startsWith('*')) continue;
                if (line.includes('process.env.') && !line.includes('typeof process')) {
                    issues++;
                    this.errors.push({
                        time: new Date(),
                        message: `[SYNC BUG] ${file}:${i + 1} uses process.env (crashes in browser). Use import.meta.env instead.`,
                        type: 'sync-integrity'
                    });
                    this.log('error', `${file}:${i + 1} — process.env in browser code`);
                }
            }

            // Check Bridge for calls to non-existent methods
            if (file.includes('Bridge')) {
                const badCalls = ['universalPull', 'getSovereignStats'];
                for (const method of badCalls) {
                    if (content.includes(`InfinitySync.${method}`)) {
                        issues++;
                        this.errors.push({
                            time: new Date(),
                            message: `[SYNC BUG] ${file} calls InfinitySync.${method}() which does not exist!`,
                            type: 'sync-integrity'
                        });
                        this.log('error', `${file} calls non-existent InfinitySync.${method}()`);
                    }
                }
            }
        }

        this.log(issues > 0 ? 'error' : 'success', `Sync integrity: ${issues} issues`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 5: ENVIRONMENT
    // ═══════════════════════════════════════════════════════════════════════════
    runEnvCheck() {
        this.log('doctor', 'Checking environment health...');
        try {
            const nodeVer = process.version;
            this.log('success', `Node.js: ${nodeVer}`);
            const stats = fs.statSync(process.cwd());
            if (stats.uid === 0 && process.platform !== 'win32') {
                this.log('warn', 'Running as root (not recommended)');
            }
            this.log('success', 'Environment: OK');
        } catch (err) {
            this.log('error', `Env check failed: ${err.message}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LIVE SERVER — Browser error collection
    // ═══════════════════════════════════════════════════════════════════════════
    startServer() {
        this.server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
            if (req.method === 'POST' && req.url === '/log') {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', () => {
                    try { const data = JSON.parse(body); this.handleRemoteLog(data); res.writeHead(200); res.end('OK'); }
                    catch (e) { res.writeHead(400); res.end('Invalid JSON'); }
                });
            } else { res.writeHead(404); res.end(); }
        });
        this.server.listen(LOG_PORT, () => this.log('doctor', `Live log server on port ${LOG_PORT}`));
        this.server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') this.log('warn', `Port ${LOG_PORT} in use, live logging disabled.`);
        });
    }

    handleRemoteLog(data) {
        const { type, message, stack, url } = data;
        if (type === 'browser-init') { this.log('info', `Browser connected: ${url}`); return; }
        const formattedMsg = `${message}${stack ? '\n' + stack : ''}`;
        this.errors.push({ time: new Date(), message: formattedMsg, type: type || 'browser' });
        this.log('error', `[Browser] ${message}`);
        this.notify('EduNorm Error', message.substring(0, 100));
        this.updateDashboard();
    }

    parseLine(line) {
        const clean = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
        if (!clean) return;
        if (clean.includes('ERROR') || clean.includes('error TS') || clean.includes('SyntaxError')) {
            this.errors.push({ time: new Date(), message: clean, type: 'compile' });
            this.log('error', clean);
            this.updateDashboard();
        } else if (clean.includes('WARNING') || clean.includes('warning') || clean.includes('deprecated')) {
            this.warnings.push({ time: new Date(), message: clean, type: 'warning' });
            this.log('warn', clean);
            this.updateDashboard();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DASHBOARD + REPORTS
    // ═══════════════════════════════════════════════════════════════════════════
    updateDashboard() {
        const now = new Date();
        const html = `<!DOCTYPE html>
<html><head><title>EduNorm Doctor Dashboard</title><meta http-equiv="refresh" content="30">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica; background: #0f172a; color: #e2e8f0; padding: 20px; line-height: 1.5; }
.container { max-width: 1000px; margin: 0 auto; }
.card { background: #1e293b; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 20px; border-left: 5px solid #6366f1; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 20px; }
.error { border-left-color: #ef4444; }
.warn { border-left-color: #f59e0b; }
.status { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8em; text-transform: uppercase; }
.status-error { background: #ef4444; color: white; }
.status-ok { background: #10b981; color: white; }
.item { padding: 10px; border-bottom: 1px solid #334155; }
.item:last-child { border-bottom: none; }
.type { color: #94a3b8; font-size: 0.8em; font-family: monospace; }
.time { color: #64748b; font-size: 0.8em; float: right; }
pre { background: #000; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.9em; color: #ef4444; }
</style></head><body>
<div class="container">
<div class="header"><h1>🩺 EduNorm Doctor Dashboard v2</h1>
<span class="status ${this.errors.length > 0 ? 'status-error' : 'status-ok'}">${this.errors.length > 0 ? 'Issues Detected' : 'All Clear'}</span></div>
<div class="card"><p><strong>Started:</strong> ${this.startTime.toLocaleString()}</p><p><strong>Updated:</strong> ${now.toLocaleString()}</p>
<p><strong>Checks:</strong> Imports ✓ | Truncation ✓ | Switch Cases ✓ | CSS ✓ | Environment ✓</p></div>
${this.errors.length > 0 ? `<div class="card error"><h2>❌ Errors (${this.errors.length})</h2>
${this.errors.slice().reverse().map(e => `<div class="item"><span class="time">${new Date(e.time).toLocaleTimeString()}</span><span class="type">[${e.type}]</span><p>${e.message.split('\n')[0]}</p>${e.message.includes('\n') ? `<pre>${e.message}</pre>` : ''}</div>`).join('')}</div>` : ''}
${this.warnings.length > 0 ? `<div class="card warn"><h2>⚠️ Warnings (${this.warnings.length})</h2>
${this.warnings.slice().reverse().map(w => `<div class="item"><span class="time">${new Date(w.time).toLocaleTimeString()}</span><span class="type">[${w.type}]</span><p>${w.message}</p></div>`).join('')}</div>` : ''}
${this.errors.length === 0 && this.warnings.length === 0 ? '<div class="card" style="text-align:center;border-left-color:#10b981;"><h2 style="color:#10b981;">✅ Everything looks great!</h2><p>All 5 checks passed.</p></div>' : ''}
</div></body></html>`;
        fs.writeFileSync(DASHBOARD_FILE, html);
    }

    generateReport() {
        const now = new Date();
        const duration = Math.round((now - this.startTime) / 1000);
        const jsonReport = {
            metadata: { generated: now.toISOString(), duration_seconds: duration, project: 'EduNorm', version: '2.0' },
            status: this.errors.length > 0 ? 'FAIL' : 'PASS',
            counts: { errors: this.errors.length, warnings: this.warnings.length },
            errors: this.errors,
            warnings: this.warnings,
        };
        fs.writeFileSync(REPORT_JSON, JSON.stringify(jsonReport, null, 2));

        let report = [];
        report.push('═══════════════════════════════════════════');
        report.push('  EduNorm Doctor Report v2');
        report.push(`  Generated: ${now.toISOString()}`);
        report.push(`  Duration: ${duration}s`);
        report.push('═══════════════════════════════════════════');
        report.push('');
        if (this.errors.length === 0 && this.warnings.length === 0) {
            report.push('✅ ALL CLEAR — No issues found!');
        } else {
            if (this.errors.length > 0) {
                report.push(`❌ ERRORS (${this.errors.length}):`);
                report.push('─────────────────────────────────────────');
                this.errors.forEach((e, i) => {
                    report.push(`  ${i + 1}. [${e.type}] ${e.message}`);
                });
            }
            if (this.warnings.length > 0) {
                report.push(`\n⚠️  WARNINGS (${this.warnings.length}):`);
                report.push('─────────────────────────────────────────');
                this.warnings.forEach((w, i) => report.push(`  ${i + 1}. [${w.type}] ${w.message}`));
            }
        }
        const reportText = report.join('\n');
        fs.writeFileSync(REPORT_FILE, reportText);
        this.updateDashboard();
        this.log('doctor', `Reports: ${C.cyan}doctor-report.txt${C.reset} and ${C.cyan}doctor-report.json${C.reset}`);
        return reportText;
    }

    start() {
        console.log(`\n${C.magenta}${C.bold}  🩺 EduNorm Doctor v2 — Deep Code Health Scanner${C.reset}\n`);

        if (this.isCheckOnly) {
            this.runEnvCheck();
            this.runImportCheck();
            this.runTruncationCheck();
            this.runCriticalFileAudit();
            this.runCSSCheck();
            this.runOrphanCSSCheck();
            this.runMenuConsistencyCheck();
            this.runSyncIntegrityCheck();
            this.generateReport();
            console.log('\n' + fs.readFileSync(REPORT_FILE, 'utf8'));
            process.exit(this.errors.length > 0 ? 1 : 0);
        } else {
            this.runEnvCheck();
            this.runImportCheck();
            this.runTruncationCheck();
            this.runCriticalFileAudit();
            this.runCSSCheck();
            this.runOrphanCSSCheck();
            this.runMenuConsistencyCheck();
            this.runSyncIntegrityCheck();
            this.startServer();
            this.updateDashboard();
            this.log('doctor', `Dashboard: ${C.cyan}doctor-dashboard.html${C.reset}`);

            const child = spawn('npx', ['vite', '--host'], {
                cwd: process.cwd(), stdio: ['inherit', 'pipe', 'pipe'], shell: true,
            });
            child.stdout.on('data', (data) => {
                const text = data.toString(); process.stdout.write(text);
                text.split('\n').forEach(line => this.parseLine(line));
            });
            child.stderr.on('data', (data) => {
                const text = data.toString(); process.stderr.write(text);
                text.split('\n').forEach(line => this.parseLine(line));
            });
            process.on('SIGINT', () => {
                this.generateReport();
                child.kill('SIGINT');
                setTimeout(() => process.exit(0), 500);
            });
        }
    }
}

new Doctor().start();
