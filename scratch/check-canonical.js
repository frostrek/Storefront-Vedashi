const https = require('https');
https.get('https://vedashiherbals.com/tovar/minimalist-spf-50-pa--b0cw5bk193', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const match = data.match(/<link rel="canonical" href="([^"]+)"/);
    console.log("Canonical:", match ? match[1] : "Not found");
  });
});
