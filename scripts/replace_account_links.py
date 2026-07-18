import re
import os

file_path = r'c:\Users\Harshit Frostrek\Desktop\VEDASHI\Storefront-Vedashi\app\account\[[...tab]]\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { ROUTES, ACCOUNT_TABS }' not in content:
    content = content.replace("import { RU_DICTIONARY } from '@/content/ru';", "import { RU_DICTIONARY } from '@/content/ru';\nimport { ROUTES, ACCOUNT_TABS } from '@/lib/routes';")

# Replace router.push(`/account/${tab.id}`)
content = re.sub(
    r'router\.push\([\`\'\"]/account/\$\{([^}]+)\}[\`\'\"]\)',
    r'router.push(ROUTES.accountTab(ACCOUNT_TABS[\1 as keyof typeof ACCOUNT_TABS]))',
    content
)

# Replace router.push('/account/xxx')
def replacer(match):
    path = match.group(2)
    query = ''
    if '?' in path:
        parts = path.split('?', 1)
        path = parts[0]
        query = '?' + parts[1]
    
    return f'router.push(ROUTES.accountTab(ACCOUNT_TABS.{path}) + \'{query}\')' if query else f'router.push(ROUTES.accountTab(ACCOUNT_TABS.{path}))'

content = re.sub(
    r'router\.push\(([\`\'\"])/account/([a-z0-9\-]+(?:\?[^\`\'\"]+)?)\1\)',
    replacer,
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done replacement')
