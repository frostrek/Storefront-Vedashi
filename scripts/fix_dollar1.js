const fs = require('fs');

const fixes = [
    {
        file: 'c:\\Users\\Harshit Frostrek\\Desktop\\VEDASHI\\Storefront-Vedashi\\app\\help-center\\support\\page.tsx',
        replacements: [
            { old: 'href={ROUTES.helpCenterSupportTicket($1)}', new: 'href={ROUTES.helpCenterSupportTicket(ticket.ticket_id)}' }
        ]
    },
    {
        file: 'c:\\Users\\Harshit Frostrek\\Desktop\\VEDASHI\\Storefront-Vedashi\\app\\account\\[[...tab]]\\page.tsx',
        replacements: [
            { old: 'onClick={() => router.push(ROUTES.helpCenterSupportTicket($1))}', new: 'onClick={() => router.push(ROUTES.helpCenterSupportTicket(linkedTicket._ticket_id))}', index: 0 },
            { old: 'onClick={() => router.push(ROUTES.helpCenterSupportTicket($1))}', new: 'onClick={() => router.push(ROUTES.helpCenterSupportTicket(ticket._ticket_id))}', index: 1 },
            { old: 'router.push(ROUTES.helpCenterSupportTicket($1));', new: 'router.push(ROUTES.helpCenterSupportTicket(enquiry._ticket_id));' }
        ]
    },
    {
        file: 'c:\\Users\\Harshit Frostrek\\Desktop\\VEDASHI\\Storefront-Vedashi\\app\\help-center\\page.tsx',
        replacements: [
            { old: 'ROUTES.helpCenter + "/" + $1', new: 'ROUTES.helpCenter + "/" + (item.slug || "")' },
            { old: 'ROUTES.helpCenterKnowledgeBaseArticle($1)', new: 'ROUTES.helpCenterKnowledgeBaseArticle(item.slug || "")' }
        ]
    },
    {
        file: 'c:\\Users\\Harshit Frostrek\\Desktop\\VEDASHI\\Storefront-Vedashi\\app\\help-center\\knowledge-base\\[slug]\\page.tsx',
        replacements: [
            { old: 'href={ROUTES.helpCenterKnowledgeBaseArticle($1)}', new: 'href={ROUTES.helpCenterKnowledgeBaseArticle(r.slug)}' }
        ]
    },
    {
        file: 'c:\\Users\\Harshit Frostrek\\Desktop\\VEDASHI\\Storefront-Vedashi\\app\\help-center\\knowledge-base\\page.tsx',
        replacements: [
            { old: 'href={ROUTES.helpCenterKnowledgeBaseArticle($1)}', new: 'href={ROUTES.helpCenterKnowledgeBaseArticle(article.slug)}' }
        ]
    }
];

for (let fix of fixes) {
    let content = fs.readFileSync(fix.file, 'utf-8');
    let original = content;
    
    for (let rule of fix.replacements) {
        if (rule.index !== undefined) {
             let split = content.split(rule.old);
             if (split.length > rule.index + 1) {
                 // re-join keeping the others the same
                 let before = split.slice(0, rule.index + 1).join(rule.old);
                 let after = split.slice(rule.index + 1).join(rule.old);
                 content = before + rule.new + after;
             }
        } else {
             content = content.replace(rule.old, rule.new);
        }
    }
    
    if (content !== original) {
        fs.writeFileSync(fix.file, content, 'utf-8');
        console.log(`Updated ${fix.file}`);
    }
}
