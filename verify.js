const fs = require('fs');

async function test() {
    const res = await fetch('http://localhost:3000/katalog', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        }
    });
    const html = await res.text();
    console.log("HTML length: " + html.length);
    if (html.includes('tovar/')) {
        console.log("SUCCESS: Found product links in raw HTML!");
    } else {
        console.log("FAILED: No product links found.");
    }
}
test();
