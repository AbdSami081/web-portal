const fs = require('fs-extra');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');

/**
 * CONFIGURATION
 */
const ZIP_OUTPUT_DIR = path.join(__dirname, 'release'); 
const ZIP_FILE_NAME = 'sapb1-web-portal.zip';
const STANDALONE_ROOT = path.join(__dirname, '.next', 'standalone');
const PUBLIC_DIR = path.join(__dirname, 'public');
const STATIC_DIR = path.join(__dirname, '.next', 'static');
const TEMP_DIR = path.join(__dirname, 'temp_build_folder');

async function automate() {
    try {
        console.log('🏗️  Starting Next.js build...');
        execSync('npm run build', { stdio: 'inherit' });

        // --- NEW LOGIC: FIND ACTUAL APP FOLDER ---
        // We look for where the server.js actually is inside the standalone folder
        let actualAppRoot = STANDALONE_ROOT;
        
        // This 'deep dive' finds the folder containing your server.js
        // ignoring the deep source/repos/... nesting
        const findServerJs = (dir) => {
            const files = fs.readdirSync(dir);
            if (files.includes('server.js')) return dir;
            for (const file of files) {
                const fullPath = path.join(dir, file);
                if (fs.statSync(fullPath).isDirectory() && file !== 'node_modules') {
                    const found = findServerJs(fullPath);
                    if (found) return found;
                }
            }
            return null;
        };

        actualAppRoot = findServerJs(STANDALONE_ROOT) || STANDALONE_ROOT;
        console.log(`📂 Found App Root at: ${actualAppRoot}`);

        // 2. Obfuscate
        console.log('🔒 Obfuscating server files...');
        obfuscateDirectory(actualAppRoot);

        // 3. Prepare Deployment Folder
        if (fs.existsSync(TEMP_DIR)) fs.removeSync(TEMP_DIR);
        fs.ensureDirSync(TEMP_DIR);

        // Copy ONLY the actual app contents (server.js, node_modules, etc.)
        fs.copySync(actualAppRoot, TEMP_DIR);
        
        // If node_modules exists at the STANDALONE_ROOT but not in actualAppRoot, copy it too
        // (Next.js sometimes puts node_modules at the very top of standalone)
        const rootNodeModules = path.join(STANDALONE_ROOT, 'node_modules');
        if (fs.existsSync(rootNodeModules) && !fs.existsSync(path.join(TEMP_DIR, 'node_modules'))) {
            fs.copySync(rootNodeModules, path.join(TEMP_DIR, 'node_modules'));
        }

        // 4. Copy Assets
        if (fs.existsSync(PUBLIC_DIR)) {
            fs.copySync(PUBLIC_DIR, path.join(TEMP_DIR, 'public'));
        }
        const destStatic = path.join(TEMP_DIR, '.next', 'static');
        fs.ensureDirSync(destStatic);
        fs.copySync(STATIC_DIR, destStatic);

        // 5. Create ZIP
        console.log('🗜️  Creating final ZIP file...');
        const zip = new AdmZip();
        zip.addLocalFolder(TEMP_DIR);
        
        if (!fs.existsSync(ZIP_OUTPUT_DIR)) fs.ensureDirSync(ZIP_OUTPUT_DIR);
        const finalPath = path.join(ZIP_OUTPUT_DIR, ZIP_FILE_NAME);
        zip.writeZip(finalPath);

        // 6. Cleanup
        fs.removeSync(TEMP_DIR);

        console.log('\n✅ BUILD SUCCESSFUL');
        console.log(`📍 ZIP ready at: ${finalPath}`);

    } catch (err) {
        console.error('❌ Automation failed:', err);
        process.exit(1);
    }
}

function obfuscateDirectory(dir) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules') obfuscateDirectory(filePath);
        } else if (file.endsWith('.js')) {
            const originalCode = fs.readFileSync(filePath, 'utf8');
            const result = JavaScriptObfuscator.obfuscate(originalCode, {
                compact: true,
                stringArray: true,
                rotateStringArray: true,
                stringArrayThreshold: 0.75,
            });
            fs.writeFileSync(filePath, result.getObfuscatedCode(), 'utf8');
        }
    });
}

automate();