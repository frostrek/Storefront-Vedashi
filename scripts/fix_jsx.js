const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Fix href=ROUTES.something -> href={ROUTES.something}
    content = content.replace(/href=ROUTES\.([a-zA-Z0-9_]+)/g, 'href={ROUTES.$1}');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walkDir('c:\\Users\\Harshit Frostrek\\Desktop\\VEDASHI\\Storefront-Vedashi\\app');
walkDir('c:\\Users\\Harshit Frostrek\\Desktop\\VEDASHI\\Storefront-Vedashi\\components');
