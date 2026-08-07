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
} catch (e) {}

const payload = JSON.stringify({
  action: "getAll",
  sheetName: "PPDB"
});

const parsedUrl = new URL(url);
const options = {
  hostname: parsedUrl.hostname,
  path: parsedUrl.pathname + parsedUrl.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log("Fetching PPDB headers and first row from Google Sheet...");
const req = https.request(options, (res) => {
  if (res.statusCode === 302 || res.statusCode === 301) {
    // Follow redirect
    const redirectUrl = res.headers.location;
    console.log("Redirected to:", redirectUrl);
    https.get(redirectUrl, (redirectRes) => {
      let body = '';
      redirectRes.on('data', (chunk) => body += chunk);
      redirectRes.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data && data.length > 0) {
            console.log("\nActual Headers in Sheet:", data[0]);
            if (data.length > 1) {
              console.log("Row 2 (First Data Row):", data[1]);
            } else {
              console.log("No data rows found.");
            }
          } else {
            console.log("No data returned or empty sheet.");
          }
        } catch (err) {
          console.error("Failed to parse response:", err.message);
          console.log("Raw response snippet:", body.substring(0, 1000));
        }
      });
    });
    return;
  }

  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (data && data.length > 0) {
        console.log("\nActual Headers in Sheet:", data[0]);
        if (data.length > 1) {
          console.log("Row 2 (First Data Row):", data[1]);
        }
      } else {
        console.log("No data returned.");
      }
    } catch (err) {
      console.error("Failed to parse response:", err.message);
      console.log("Raw response:", body);
    }
  });
});

req.on('error', (e) => {
  console.error("Request error:", e.message);
});

req.write(payload);
req.end();
