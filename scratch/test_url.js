const { URL } = require('url');

function test() {
    const originalUrl = "http://localhost:3000/products?test_ip=8.8.8.8";
    const country = "us";
    const pathname = "/products";
    
    const url = new URL(originalUrl);
    url.pathname = `/${country}${pathname}`;
    
    console.log("Original:", originalUrl);
    console.log("Target:", url.toString());
}

test();
