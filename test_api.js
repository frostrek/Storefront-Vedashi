const fs = require('fs');
async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/products/filter?limit=12');
        console.log("localhost 5000 status:", res.status);
    } catch(e) {
        console.log("localhost 5000 failed:", e.message);
    }
    try {
        const res = await fetch('http://127.0.0.1:5000/api/products/filter?limit=12');
        console.log("127.0.0.1 5000 status:", res.status);
    } catch(e) {
        console.log("127.0.0.1 5000 failed:", e.message);
    }
}
test();
