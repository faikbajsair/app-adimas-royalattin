// googleSheets.ts - Database Connector via Apps Script Web App
// Metode ini jauh lebih mudah dan aman dibanding Service Account JSON.

import dns from 'dns';
try {
  if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // Fallback jika berada di environment non-Node
}

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

export async function callSheetsAPI(action: string, payload: Record<string, any>) {
  if (!SCRIPT_URL) {
    throw new Error('GOOGLE_SCRIPT_URL belum dikonfigurasi di environment variables.');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow', // Mengikuti redirect 302 dari Google Apps Script
      cache: 'no-store', // Mencegah caching oleh Next.js untuk data dinamis real-time
    });

    if (!response.ok) {
      throw new Error(`Google Script API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (e: any) {
    console.error('API Call failed:', e.message);
    throw e;
  }
}
