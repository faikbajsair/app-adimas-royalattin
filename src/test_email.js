const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env.local or .env
function loadEnv(filePath) {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      });
    }
  } catch (e) {
    console.error(`Failed to load ${filePath}:`, e.message);
  }
}

loadEnv('.env');
loadEnv('.env.local');

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log("=== SMTP CONFIGURATION TESTING ===");
console.log("SMTP_HOST:", host);
console.log("SMTP_PORT:", port);
console.log("SMTP_USER:", user ? user : "(Belum dikonfigurasi)");
console.log("SMTP_PASS:", pass ? "********" : "(Belum dikonfigurasi)");

if (!user || !pass) {
  console.log("\n⚠️ Notifikasi email dilewati karena SMTP_USER / SMTP_PASS belum diset di .env atau .env.local.");
  console.log("Silakan konfigurasi email pengirim Anda terlebih dahulu untuk menjalankan tes pengiriman email.");
  process.exit(0);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass,
  },
});

console.log("\nMencoba mengirim email uji coba ke tmroyalattin@gmail.com...");
transporter.sendMail({
  from: `"PPDB Royal At-Tin Test" <${user}>`,
  to: 'tmroyalattin@gmail.com',
  subject: 'Test Notifikasi PPDB Royal At-Tin',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #3b82f6;">Tes Koneksi Notifikasi Email Sukses!</h2>
      <p>Jika Anda menerima email ini, berarti modul nodemailer dan kredensial SMTP Anda telah terkonfigurasi dengan benar.</p>
    </div>
  `
}, (err, info) => {
  if (err) {
    console.error("❌ Pengiriman gagal:", err.message);
  } else {
    console.log("✉️ Pengiriman sukses! MessageId:", info.messageId);
  }
});
