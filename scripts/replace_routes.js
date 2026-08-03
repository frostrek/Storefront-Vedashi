const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    let needsRoutes = false;

    // Improved regex to catch href={`...`} 
    const replacements = [
        { regex: /[`'"]\/forgot-password[`'"]/g, sub: match => { needsRoutes=true; return 'ROUTES.forgotPassword'; } },
        { regex: /[`'"]\/reset-password[`'"]/g, sub: match => { needsRoutes=true; return 'ROUTES.resetPassword'; } },
        { regex: /[`'"]\/help-center\/faq[`'"]/g, sub: match => { needsRoutes=true; return 'ROUTES.helpCenterFaq'; } },
        { regex: /[`'"]\/help-center\/knowledge-base[`'"]/g, sub: match => { needsRoutes=true; return 'ROUTES.helpCenterKnowledgeBase'; } },
        { regex: /[`'"]\/help-center\/support[`'"]/g, sub: match => { needsRoutes=true; return 'ROUTES.helpCenterSupport'; } },
        { regex: /[`'"]\/help-center\/customer-enquiry[`'"]/g, sub: match => { needsRoutes=true; return 'ROUTES.helpCenterCustomerEnquiry'; } },
        { regex: /[`'"]\/help-center[`'"]/g, sub: match => { needsRoutes=true; return 'ROUTES.helpCenter'; } },
    ];

    for (let rule of replacements) {
        content = content.replace(rule.regex, rule.sub);
    }

    if (content !== original) {
        if (needsRoutes && !content.includes('import { ROUTES')) {
            content = content.replace("import { RU_DICTIONARY } from '@/content/ru';", "import { RU_DICTIONARY } from '@/content/ru';\nimport { ROUTES } from '@/lib/routes';");
            if(content === original) { // if RU_DICTIONARY is not there
               // let's just put it at the top
               content = "import { ROUTES } from '@/lib/routes';\n" + content;
            }
        }
        
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
