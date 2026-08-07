const https = require('https');
const fs = require('fs');
const path = require('path');

let url = "https://script.google.com/macros/s/AKfycbwnQn0NNLpIJq_ICtyuV4Z6kWToqWPKmkNK5e7CoQX1eVyuCs-x6DJ96G3HwAXPEvFk/exec";

try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  const match = envContent.match(/GOOGLE_SCRIPT_URL=["']?([^"'\r\n]+)/);
  if (match && match[1]) {
    url = match[1];
  }
} catch (e) {
  console.log("No .env found or failed parsing, using hardcoded fallback.");
}

console.log("Testing connection to GOOGLE_SCRIPT_URL...");
console.log("URL:", url);

const start = Date.now();

const req = https.get(url, (res) => {
  console.log(`Response received in ${Date.now() - start}ms`);
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log("Body length:", body.length);
    console.log("Snippet:", body.substring(0, 500));
  });
});

req.on('error', (e) => {
  console.error(`Connection error in ${Date.now() - start}ms:`, e.message);
  console.error(e);
});

req.end();
