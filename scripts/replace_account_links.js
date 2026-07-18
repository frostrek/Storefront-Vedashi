const fs = require('fs');

const filePath = 'c:\\Users\\Harshit Frostrek\\Desktop\\VEDASHI\\Storefront-Vedashi\\components\\account\\NotificationCenter.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('import { ROUTES, ACCOUNT_TABS }')) {
    content = content.replace("import { RU_DICTIONARY } from '@/content/ru';", "import { RU_DICTIONARY } from '@/content/ru';\nimport { ROUTES, ACCOUNT_TABS } from '@/lib/routes';");
}

content = content.replace(/router\.push\(([`'"])\/account\/notifications\1(?:\s+as\s+any)?\)/g, "router.push(ROUTES.accountTab(ACCOUNT_TABS.notifications) as any)");

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done replacement');
