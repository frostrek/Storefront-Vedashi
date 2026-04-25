const { URL } = require('url');

function test() {
    const base = "http://localhost:3000/products?test_ip=8.8.8.8";
    const relative = "/us";
    const url = new URL(relative, base);
    
    console.log("Base:", base);
    console.log("Relative:", relative);
    console.log("Result:", url.toString());
}

test();
